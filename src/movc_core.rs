use bson::Document;
use mongodb::{
  error::Error,
  sync::{Collection, Database},
};

pub struct Core {
  currencies: Collection<Document>,
  countries: Collection<Document>,
  pending_countries: Collection<Document>,
  deleted_countries: Collection<Document>,
  geo: Collection<Document>,
}

impl Core {
  pub fn new(db: &Database) -> Core {
    Core {
      countries: db.collection("countries"),
      currencies: db.collection("currencies"),
      pending_countries: db.collection("pending-countries"),
      deleted_countries: db.collection("deleted-countries"),
      geo: db.collection("geo"),
    }
  }
  pub fn get_country(&self, name: &String) -> Result<Option<Document>, Error> {
    self.countries.find_one(bson::doc! { "idc": name }, None)
  }
  pub fn get_countries(&self) -> Vec<Document> {
    let cursor = self.countries.find(None, None).unwrap();
    let mut total: Vec<Document> = Vec::new();
    for doc in cursor {
      total.push(doc.unwrap());
    }
    total
  }
}
