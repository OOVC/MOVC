export interface country {
  idc: string;
  name: string;
  description: string;
  geo?: geoMovc;
}

export interface geoMovc {
  type: string;
  properties: {
    name: string;
    stroke?: string;
    "stroke-width"?: number;
    "stroke-opacity"?: number;
    fill?: string;
    "fill-opacity"?: number;
  };
  geometry: {
    type: string;
    coordinates: Array<Array<Array<number>>>;
  };
}

export interface addCountryResp {
  code: string;
  redirect?: string;
}
