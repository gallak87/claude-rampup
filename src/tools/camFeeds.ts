export interface CamFeed {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  mjpegUrl: string;
}

export const CAM_FEEDS: CamFeed[] = [];
