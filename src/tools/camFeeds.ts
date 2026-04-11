export interface CamFeed {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  streamUrl: string;
}

export const CAM_FEEDS: CamFeed[] = [
  {
    id: 'dublinpub',
    name: 'Dublin Pub Cam',
    location: 'Dublin, Ireland',
    lat: 53.3498,
    lng: -6.2603,
    // Token expires — refresh from DevTools > Network > m3u8 on earthcam.com/world/ireland/dublin/?cam=dublinpub
    streamUrl: '/ec-proxy/fecnetwork/14320.flv/playlist.m3u8?t=tBywzTYURGbEtGxF1LfyCkm5AvmWDkmIcwUf7arKv5SGIJd3AbR4IqqRViRub5o7&td=202604101948',
  },
];
