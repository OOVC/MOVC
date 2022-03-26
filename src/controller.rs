use actix_web::{error::BlockingError, get, web, HttpResponse, Responder};
use bson::Document;
use mongodb::error::Error;

#[get("/api/country/{name}")]
pub async fn country(
  app_data: web::Data<crate::AppState>,
  name: web::Path<String>,
) -> impl Responder {
  let result = web::block(move || app_data.core.get_country(&name)).await;
  match result {
    Ok(result) => HttpResponse::Ok().json(result),
    Err(e) => {
      println!("Error while getting, {:?}", e);
      HttpResponse::InternalServerError().finish()
    }
  }
}

#[get("/api/countries")]
pub async fn countries(app_data: web::Data<crate::AppState>) -> impl Responder {
  let result = web::block(move || app_data.core.get_countries()).await;
  resolve_collection_result(result)
}

fn resolve_collection_result(
  result: Result<Vec<Document>, BlockingError<Error>>,
) -> impl Responder {
  match result {
    Ok(result) => HttpResponse::Ok().json(result),
    Err(e) => {
      println!("Error while getting, {:?}", e);
      HttpResponse::InternalServerError().finish()
    }
  }
}
