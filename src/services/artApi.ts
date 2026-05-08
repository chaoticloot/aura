import { ArtPiece, Artwork, SearchResponse } from '../types';

const MET_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
const AIC_URL = 'https://api.artic.edu/api/v1/artworks';
const CMA_URL = 'https://openaccess-api.clevelandart.org/api/artworks';
const SMK_URL = 'https://api.smk.dk/statens-museum-for-kunst/v1/art/search';

function stripHtml(html: string | undefined | null) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

async function fetchJson(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// --- Methods for MET ---
async function searchMet(query: string, mediumFilter: string, yearEnd?: number): Promise<ArtPiece[]> {
  try {
    let url = `${MET_URL}/search?isPublicDomain=true&hasImages=true`;
    if (yearEnd) url += `&dateBegin=-4000&dateEnd=${yearEnd}`;
    let q = query || 'painting';
    if (mediumFilter) q += ` ${mediumFilter}`;
    url += `&q=${encodeURIComponent(q)}`;
    const data = await fetchJson(url);
    if (!data || !data.objectIDs) return [];
    
    // Fetch up to 30 Met objects (since we have to fetch details 1 by 1)
    const ids = data.objectIDs.slice(0, 30);
    const details = await Promise.all(ids.map(id => fetchJson(`${MET_URL}/objects/${id}`)));
    
    return details
      .filter((d: any) => d && d.primaryImageSmall)
      .map((d: any) => ({
        id: `met-${d.objectID}`,
        title: stripHtml(d.title) || 'Untitled',
        artist: stripHtml(d.artistDisplayName) || 'Artist Unknown',
        date: stripHtml(d.objectDate) || 'n.d.',
        imageUrl: d.primaryImage,
        imageUrlSmall: d.primaryImageSmall,
        museum: 'The MET',
        medium: stripHtml(d.medium),
        dimensions: stripHtml(d.dimensions),
        rights: 'CC0 Public Domain',
        objectUrl: d.objectURL,
        details: d
      }));
  } catch (e) {
    console.error('Met search failed', e);
    return [];
  }
}

// --- Methods for AIC (Supports IIIF) ---
async function searchAIC(query: string, mediumFilter: string, yearEnd?: number): Promise<ArtPiece[]> {
  try {
    const limit = 50;
    let q = query;
    if (mediumFilter) q += ` ${mediumFilter}`;
    if (!q) q = 'painting';
    if (yearEnd) q += ` AND date_end:[* TO ${yearEnd}]`;
    const data = await fetchJson(`${AIC_URL}/search?q=${encodeURIComponent(q)}&query[term][is_public_domain]=true&fields=id,title,artist_display,date_display,image_id,medium_display,dimensions&limit=${limit}`);
    if (!data || !data.data) return [];
    const config = data.config;
    
    return data.data
      .filter((d: any) => d.image_id)
      .map((d: any) => ({
        id: `aic-${d.id}`,
        title: stripHtml(d.title) || 'Untitled',
        artist: stripHtml(d.artist_display) || 'Artist Unknown',
        date: stripHtml(d.date_display) || 'n.d.',
        imageUrl: `${config.iiif_url}/${d.image_id}/full/843,/0/default.jpg`,
        imageUrlSmall: `${config.iiif_url}/${d.image_id}/full/400,/0/default.jpg`, 
        museum: 'AIC Chicago',
        medium: stripHtml(d.medium_display),
        dimensions: stripHtml(d.dimensions),
        rights: 'CC0 Public Domain',
        objectUrl: `https://www.artic.edu/artworks/${d.id}`,
        details: d
      }));
  } catch (e) {
    console.error('AIC search failed', e);
    return [];
  }
}

// --- Methods for CMA ---
async function searchCMA(query: string, mediumFilter: string, yearEnd?: number): Promise<ArtPiece[]> {
  try {
    const limit = 50;
    let q = query || 'painting';
    let url = `${CMA_URL}/?q=${encodeURIComponent(q)}&cc0=1&has_image=1&limit=${limit}`;
    if (mediumFilter) url += `&type=${encodeURIComponent(mediumFilter)}`;
    if (yearEnd) url += `&creation_date_before=${yearEnd}`;
    const data = await fetchJson(url);
    if (!data || !data.data) return [];
    
    return data.data.map((d: any) => ({
      id: `cma-${d.id}`,
      title: stripHtml(d.title) || 'Untitled',
      artist: stripHtml(d.creators && d.creators[0]?.description) || 'Artist Unknown',
      date: stripHtml(d.creation_date) || 'n.d.',
      imageUrl: d.images?.web?.url || d.images?.print?.url,
      imageUrlSmall: d.images?.web?.url || d.images?.print?.url,
      museum: 'Cleveland Art',
      medium: stripHtml(d.type),
      dimensions: stripHtml(d.dimensions),
      rights: 'CC0 Public Domain',
      objectUrl: d.url,
      details: d
    }));
  } catch (e) {
    console.error('CMA search failed', e);
    return [];
  }
}

// --- Methods for SMK ---
async function searchSMK(query: string, mediumFilter: string, yearEnd?: number): Promise<ArtPiece[]> {
  try {
    const limit = 50;
    let q = query;
    if (mediumFilter) q += ` ${mediumFilter}`;
    if (!q) q = 'painting';
    let filters = '[has_image:true],[public_domain:true]';
    if (yearEnd) filters += `,[production_date_end:[-5000 TO ${yearEnd}]]`;
    const data = await fetchJson(`${SMK_URL}?keys=${encodeURIComponent(q)}&filters=${encodeURIComponent(filters)}&rows=${limit}`);
    if (!data || !data.items) return [];
    
    return data.items.map((d: any) => {
      const creator = d.production?.[0]?.creator || 'Artist Unknown';
      return {
        id: `smk-${d.object_number}`,
        title: stripHtml(d.titles?.[0]?.title) || 'Untitled',
        artist: stripHtml(creator),
        date: stripHtml(d.production?.[0]?.production_date_notes) || 'n.d.',
        imageUrl: d.image_native,
        imageUrlSmall: d.image_native ? `${d.image_native}?width=400` : '', 
        museum: 'SMK Denmark',
        medium: stripHtml(d.medium?.[0]) || '',
        dimensions: stripHtml(d.dimensions?.[0]?.notes) || '',
        rights: 'CC0 Public Domain',
        objectUrl: `https://open.smk.dk/en/artwork/image/${d.object_number}`,
        details: d
      };
    }).filter((item: any) => item.imageUrlSmall);
  } catch (e) {
    console.error('SMK search failed', e);
    return [];
  }
}

// --- Methods for V&A Museum (Keyless) ---
async function searchVA(query: string, mediumFilter: string, yearEnd?: number): Promise<ArtPiece[]> {
  try {
    const limit = 50;
    let q = query;
    if (mediumFilter) q += ` ${mediumFilter}`;
    if (!q) q = 'painting';
    let url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(q)}&page_size=${limit}&images_exist=1`;
    if (yearEnd) url += `&year_made_to=${yearEnd}`;
    const data = await fetchJson(url);
    if (!data || !data.records) return [];

    return data.records.map((d: any) => ({
      id: `va-${d.systemNumber}`,
      title: stripHtml(d._primaryTitle) || 'Untitled',
      artist: stripHtml(d._primaryMaker?.name) || 'Artist Unknown',
      date: stripHtml(d._primaryDate) || 'n.d.',
      imageUrl: d._images?._primary_thumbnail ? d._images._primary_thumbnail.replace('!100,100', '!800,') : '',
      imageUrlSmall: d._images?._primary_thumbnail ? d._images._primary_thumbnail.replace('!100,100', '!400,') : '', 
      museum: 'V&A Museum',
      rights: 'CC0 Public Domain',
      objectUrl: `https://collections.vam.ac.uk/item/${d.systemNumber}`,
      details: d
    })).filter((item: any) => item.imageUrlSmall);
  } catch (e) {
    return [];
  }
}

// --- Methods for Wikimedia Commons (CC BY etc) ---
async function searchWikimedia(query: string, mediumFilter: string, yearEnd?: number): Promise<ArtPiece[]> {
  try {
    let q = query || 'painting';
    if (mediumFilter) q += ` ${mediumFilter}`;
    // Restrict to images from Commons that have known licenses
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*`;
    const data = await fetchJson(url);
    if (!data || !data.query || !data.query.pages) return [];

    return Object.values(data.query.pages).map((p: any) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata;
      
      const rights = meta?.LicenseShortName?.value || 'Public Domain';
      // filter out non-commercial or no-derivatives
      if (rights.includes('NC') || rights.includes('ND')) return null;
      
      let title = meta?.ObjectName?.value || p.title.replace('File:', '').split('.')[0];
      // strip html from title
      title = stripHtml(title).substring(0, 60);

      let artist = meta?.Artist?.value || 'Artist Unknown';
      artist = stripHtml(artist);
      let attribution = meta?.AttributionRequired?.value === 'true' ? (meta?.Attribution?.value || meta?.Credit?.value || artist) : '';
      attribution = stripHtml(attribution);

      return {
        id: `wiki-${p.pageid}`,
        title: title,
        artist: artist,
        date: stripHtml(meta?.DateTimeOriginal?.value) || 'n.d.',
        imageUrl: info.url,
        imageUrlSmall: info.thumburl || info.url,
        museum: 'Wikimedia Commons',
        medium: stripHtml(meta?.Medium?.value) || '',
        rights: rights,
        attribution: attribution,
        objectUrl: info.descriptionurl,
        details: meta
      };
    }).filter(Boolean);
  } catch(e) {
    console.error('Wiki search failed', e);
    return [];
  }
}

export async function searchArtworks(query: string, mediumFilter: string = '', isStrict: boolean = false, yearEnd?: number): Promise<ArtPiece[]> {
  let apiQuery = query;
  let isAuthorSearch = false;
  if (query.toLowerCase().startsWith('author:')) {
    apiQuery = query.substring(7).trim();
    isAuthorSearch = true;
  }

  const providers = [
    searchMet(apiQuery, mediumFilter, yearEnd), 
    searchAIC(apiQuery, mediumFilter, yearEnd), 
    searchCMA(apiQuery, mediumFilter, yearEnd), 
    searchSMK(apiQuery, mediumFilter, yearEnd),
    searchVA(apiQuery, mediumFilter, yearEnd),
    searchWikimedia(apiQuery, mediumFilter, yearEnd)
  ];
  
  const results = await Promise.allSettled(providers);
  let combined = results
    .filter((r): r is PromiseFulfilledResult<ArtPiece[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  if (isAuthorSearch && apiQuery) {
    const qRaw = apiQuery.toLowerCase();
    combined = combined.filter(art => art.artist.toLowerCase().includes(qRaw));
  } else if (isStrict && apiQuery) {
    const qRaw = apiQuery.toLowerCase().trim();
    combined = combined.filter(art => {
      const t = art.title.toLowerCase();
      const a = art.artist.toLowerCase();
      const m = (art.medium || '').toLowerCase();
      return t.includes(qRaw) || a.includes(qRaw) || m.includes(qRaw);
    });
  }

  if (yearEnd) {
    combined = combined.filter(art => {
      // Find numbers in Date string matching a year
      const dateStr = String(art.date || '');
      const match = dateStr.match(/\b([1-9][0-9]{2,3})\b/);
      if (match) {
        const year = parseInt(match[1], 10);
        return year <= yearEnd;
      }
      return true; // if we can't parse date, assume it's fine
    });
  }

  // Balanced shuffle
  return combined.sort(() => Math.random() - 0.5);
}

// Keeping these for background compatibility if needed, but we should refactor
export async function getArtworkDetails(id: number): Promise<ArtPiece | null> {
  // This is now specific to MET IDs, which might break. 
  // We should probably rely on the ID prefix.
  return null; 
}

export async function getArtworksInBatch(ids: number[]): Promise<ArtPiece[]> {
  // Mocking featured ones for now since we changed the signature
  const res = await searchArtworks('Rembrandt');
  return res.slice(0, 12);
}
