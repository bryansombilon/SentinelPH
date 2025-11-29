export interface EarthquakeFeature {
  type: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: number[]; // [longitude, latitude, depth]
  };
  id: string;
}

export interface EarthquakeResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
}

export interface TyphoonSignal {
  level: number;
  areas: string[];
}

export interface TyphoonData {
  hasCyclone: boolean;
  name: string;
  issuedAt: string;
  url: string;
  signals: TyphoonSignal[];
  summary: string;
}

export interface VolcanoStatus {
  name: string;
  level: string;
  date: string;
  url: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
