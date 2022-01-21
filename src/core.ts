import { country } from "./interfaces";

export class Core {
  db: any;
  countries: any;
  pending: any;
  deleted: any;
  currencies: any;
  constructor(db) {
    this.countries = db.collection("countries");
    this.pending = db.collection("pending-countries");
    this.deleted = db.collection("deleted-countries");
    this.currencies = db.collection("currencies");
  }
  getCountry(name:string): country{
    return 
  }
}
