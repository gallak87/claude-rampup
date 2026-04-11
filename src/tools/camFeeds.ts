export interface CamFeed {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  streamUrl: string;
}

// Live streams via /ec-proxy/ → videos-3.earthcam.com (Referer spoofed by Vite proxy)
// Archive streams via /ec-arch/ → video2archives.earthcam.com
// Tokens in ?t=...&td=... expire — refresh from DevTools > Network > m3u8 on the cam page

export const CAM_FEEDS: CamFeed[] = [
  {
    id: 'niagara-falls',
    name: 'Niagara Falls',
    location: 'Ontario, Canada',
    lat: 43.0896,
    lng: -79.0849,
    streamUrl: '/ec-proxy/fecnetwork/15527.flv/playlist.m3u8?t=rTpEtwAFUW0%2BXz8YVqXGLgc1t%2FIlFVoqI8yJCFh1LQktKWJQnKRG9BXPf%2BjVyWey&td=202604102021',
  },
  {
    id: 'cn-tower',
    name: 'CN Tower',
    location: 'Toronto, Canada',
    lat: 43.6426,
    lng: -79.3871,
    streamUrl: '/ec-proxy/fecnetwork/9298.flv/playlist.m3u8?t=j3sQ8m%2Bs03ft5uiPPqbTiB3%2Bjo5AWwWjacV9DvtPNvqrmxwfnk3cQOR9Kok2giOe&td=202604102023',
  },
  {
    id: 'broadway-nashville',
    name: 'Broadway',
    location: 'Nashville, TN',
    lat: 36.1627,
    lng: -86.7816,
    streamUrl: '/ec-proxy/fecnetwork/24935.flv/playlist.m3u8?t=mexLmPaUse3br05vrUOgWmHCY3zSSIm2XkB8hKYeViRNneTN4KlMH6DBCGDaoMsZ&td=202604102024',
  },
  {
    id: 'chicago-skydeck',
    name: 'Chicago Skydeck',
    location: 'Chicago, IL',
    lat: 41.8789,
    lng: -87.6359,
    streamUrl: '/ec-proxy/fecnetwork/22820.flv/playlist.m3u8?t=dBtN5TW1T8fuVoEEKE7PQBgYDpfkwAKrcIirPYM3sbC53pLHGp%2FeUEcuz%2Fd4Rwe4&td=202604102009',
  },
  {
    id: 'grand-haven',
    name: 'Lake Michigan',
    location: 'Grand Haven, MI',
    lat: 43.0631,
    lng: -86.2284,
    streamUrl: '/ec-proxy/fecnetwork/4465.flv/playlist.m3u8?t=FUfXoJ%2BGieWj%2F9G0yz%2Fzpazt551d7Q8nQ72tOqiWLSkSvMfJ2QyD9beGNXhoKhxQ&td=202604102014',
  },
  {
    id: 'saipan',
    name: 'Saipan Beach',
    location: 'Northern Mariana Islands',
    lat: 15.1779,
    lng: 145.7510,
    streamUrl: '/ec-proxy/fecnetwork/10610.flv/playlist.m3u8?t=lsxILM7PqtNuwfYtnPiaMPrWpcDy6oNcRlgh198MYQkJD3r9bHMh7f0%2F7Gtn6rBW&td=202604102014',
  },
  {
    id: 'cats-meo-nola',
    name: "Cat's Meow Karaoke",
    location: 'New Orleans, LA',
    lat: 29.9511,
    lng: -90.0715,
    streamUrl: '/ec-proxy/fecnetwork/9106.flv/playlist.m3u8?t=5TmUaE4zfJjhupsEens8yiygw0KuoPQ8NS75rt5Oo7JSmf%2BF62BcuW1oKNUr9rQW&td=202604102005',
  },
  {
    id: 'falcon-cam',
    name: 'Falcon Cam',
    location: 'Sacramento, CA',
    lat: 38.5816,
    lng: -121.4944,
    streamUrl: '/ec-proxy/fecnetwork/31727.flv/playlist.m3u8?t=ExFeV%2FBf0dmljr0zkQFmgU0ehgEEZVRkMEILj2Ig%2Fwm5rS1jkf7ExFc8JwTwY%2FmB&td=202604102013',
  },
  {
    id: 'coastal-georgia',
    name: 'College of Coastal Georgia',
    location: 'Brunswick, GA',
    lat: 31.1499,
    lng: -81.4915,
    streamUrl: '/ec-proxy/fecnetwork/37173.flv/playlist.m3u8?t=CEAAskkOZuCvYAZ81XTjQ3BKScZ4sXxLqS3gPC7O%2FDjxjjWdA6Vo4W%2FER7jiBk6t&td=202604102016',
  },
  {
    id: 'st-croix',
    name: 'St. Croix',
    location: 'US Virgin Islands',
    lat: 17.7291,
    lng: -64.7897,
    streamUrl: '/ec-proxy/fecnetwork/45077.flv/playlist.m3u8?t=IaBzQqQ9PF2iZeCvMbFTp6ix76s27WFOhowUMND1AQDCtZFquhnGGmV%2Btflzm7kz&td=202604102013',
  },
  {
    id: 'dublinpub',
    name: 'Dublin Pub Cam',
    location: 'Dublin, Ireland',
    lat: 53.3498,
    lng: -6.2603,
    streamUrl: '/ec-proxy/fecnetwork/14320.flv/playlist.m3u8?t=tBywzTYURGbEtGxF1LfyCkm5AvmWDkmIcwUf7arKv5SGIJd3AbR4IqqRViRub5o7&td=202604101948',
  },
  {
    id: 'amazon-rainforest',
    name: 'Amazon Rainforest',
    location: 'Madre de Dios, Peru',
    lat: -12.5933,
    lng: -70.0522,
    streamUrl: '/ec-proxy/fecnetwork/39899.flv/playlist.m3u8?t=m3Ri9Yb6K6vvBdRtO%2FS9aeDiSqA2FfwV8oox5LrLhopQx%2BXjFBKo8U7z4Wis7QLh&td=202604102018',
  },
  {
    id: 'causeway-bay',
    name: 'Causeway Bay',
    location: 'Hong Kong',
    lat: 22.2800,
    lng: 114.1822,
    streamUrl: '/ec-proxy/fecnetwork/38148.flv/playlist.m3u8?t=c8kolm9Nh5XwziJhiq4n25Ide5dLX7rPBmkz4D8rjBO2JogPEDyyQyuU%2BJd4WtLe&td=202604102018',
  },
  {
    id: 'gangnam',
    name: 'Gangnam',
    location: 'Seoul, South Korea',
    lat: 37.4979,
    lng: 127.0276,
    streamUrl: '/ec-proxy/fecnetwork/32784.flv/playlist.m3u8?t=Re8NX79fTJK9E13XCBfxxzXywfE%2FxPmVenKRNYeGIYmgBWzMck5uxSCUqzo3tAQ5&td=202604102022',
  },
  {
    id: 'seoul',
    name: 'Songridan-gil',
    location: 'Seoul, South Korea',
    lat: 37.5665,
    lng: 126.9780,
    streamUrl: '/ec-arch/archives/_definst_/MP4:permanent/32781/2024/06/11/1301.mp4/playlist.m3u8',
  },
  {
    id: 'ricks-cafe',
    name: "Rick's Cafe",
    location: 'Negril, Jamaica',
    lat: 18.2693,
    lng: -78.3477,
    streamUrl: '/ec-proxy/fecnetwork/4369.flv/playlist.m3u8?t=glxQQqQ0DAoAB2%2FzAoNg%2B7sdqx9FK2W3HOFIGyV7f20W3uQAQfgp0kbN5KgdvX1Q&td=202604102016',
  },
  {
    id: 'moscow',
    name: 'Moscow Skyline',
    location: 'Moscow, Russia',
    lat: 55.7558,
    lng: 37.6176,
    streamUrl: '/ec-proxy/fecnetwork/moscowHD1.flv/playlist.m3u8?t=9yAJLpDk2Jq5li648kp2FKlaBygPb60ds8jKhLA0ASqhWP59Mb3VdODyO8FSOBEEDQtOOHUtWP2huIu1BaZSVg%3D%3D&td=202604102017',
  },
  {
    id: 'tamariu',
    name: 'Tamariu Beach',
    location: 'Tamariu, Spain',
    lat: 41.9217,
    lng: 3.1808,
    streamUrl: '/ec-proxy/fecnetwork/21204.flv/playlist.m3u8?t=GL%2Bm74Juf%2F%2F%2BuarLu4p42zDTiKYfwjF0XlSZSjaUhhcpe4NmR4Yoy1EiGYGKnYfm&td=202604102021',
  },
];
