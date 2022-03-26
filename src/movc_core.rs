use bson::Document;
use mongodb::{
  error::Error,
  sync::{Collection, Database},
};

pub struct Core {
  currencies: Collection<Document>,
  countries: Collection<Document>,
  pending_countries: Collection<Document>,
}

impl Core {
  pub fn new(db: &Database) -> Core {
    Core {
      countries: db.collection("countries"),
      currencies: db.collection("currencies"),
      pending_countries: db.collection("pending-countries"),
    }
  }
  pub fn get_country(&self, name: &String) -> Result<Option<Document>, Error> {
    self.countries.find_one(bson::doc! { "idc": name }, None)
  }

  pub fn get_currency(&self, name: &String) -> Result<Option<Document>, Error> {
    self.currencies.find_one(bson::doc! { "idc": name }, None)
  }

  pub fn get_countries(&self) -> Result<Vec<Document>, Error> {
    self.get_full_collection(&self.countries)
  }

  pub fn get_currencies(&self) -> Result<Vec<Document>, Error> {
    self.get_full_collection(&self.currencies)
  }

  pub fn get_pending_countries(&self) -> Result<Vec<Document>, Error> {
    self.get_full_collection(&self.pending_countries)
  }

  fn get_full_collection(&self, collection: &Collection<Document>) -> Result<Vec<Document>, Error> {
    let cursor = collection.find(None, None).unwrap();
    let to_resolve: Vec<Result<Document, Error>> = cursor.collect();
    let mut total: Vec<Document> = Vec::new();
    for doc in to_resolve {
      if let Ok(mut doc) = doc {
        doc.remove("_id");
        doc.remove("googid");
        total.push(doc);
      } else if let Err(e) = doc {
        return Err(e);
      }
    }
    Ok(total)
  }
}
