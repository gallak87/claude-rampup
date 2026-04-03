export interface CamFeed {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  youtubeId: string;
}

// YouTube IDs — all 24/7 live streams, swap ID if one goes stale
export const CAM_FEEDS: CamFeed[] = [
  {
    id: 'times-square',
    name: 'Times Square',
    location: 'New York, USA',
    lat: 40.758,
    lng: -73.9855,
    youtubeId: 'xRPjKQtRXR8',
  },
  {
    id: 'old-faithful',
    name: 'Old Faithful',
    location: 'Yellowstone, USA',
    lat: 44.4605,
    lng: -110.8281,
    youtubeId: 'aEBDgGjlEoo',
  },
  {
    id: 'shibuya',
    name: 'Shibuya Crossing',
    location: 'Tokyo, Japan',
    lat: 35.6595,
    lng: 139.7004,
    youtubeId: 'JMVFbNfCXxY',
  },
  {
    id: 'sydney',
    name: 'Sydney Harbour',
    location: 'Sydney, Australia',
    lat: -33.8568,
    lng: 151.2153,
    youtubeId: 'ZCvBdGMPpgE',
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    location: 'Tromsø, Norway',
    lat: 69.6496,
    lng: 18.9560,
    youtubeId: 'Y2kPHSBMfgQ',
  },
];
