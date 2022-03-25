use bson::Document;
use mongodb::{
  error::Error,
  sync::{Collection, Database},
};

pub struct Core {
  db: Database,
  countries: Collection<Document>,
}

impl Core {
  pub fn new(db: &Database) -> Core {
    Core {
      db: db.clone(),
      countries: db.collection("countries"),
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
