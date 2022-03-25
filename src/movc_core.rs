use bson::Document;
use futures::stream::{self, StreamExt};
use mongodb::{
  error::Error,
  results::InsertOneResult,
  sync::{Client, Collection, Cursor, Database},
};
use serde::{Deserialize, Serialize};

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
  // pub fn get_countries(&self) {
  //   let cursor = self.countries.find(None, None);
  // }
}
