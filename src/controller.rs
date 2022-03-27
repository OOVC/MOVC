use actix_web::{error::BlockingError, get, web, HttpResponse, Responder};
use bson::Document;
use mongodb::error::Error;

#[get("/country/{name}")]
pub async fn country(
  app_data: web::Data<crate::AppState>,
  name: web::Path<String>,
) -> impl Responder {
  let result = web::block(move || app_data.core.get_country(&name)).await;
  resolve_doc_result(result)
}

#[get("/pending-country/{cidc}")]
pub async fn pending_country(
  app_data: web::Data<crate::AppState>,
  cidc: web::Path<String>,
) -> impl Responder {
  let result = web::block(move || app_data.core.get_pending_country(&cidc)).await;
  resolve_doc_result(result)
}

#[get("/currency/{name}")]
pub async fn currency(
  app_data: web::Data<crate::AppState>,
  name: web::Path<String>,
) -> impl Responder {
  let result = web::block(move || app_data.core.get_currency(&name)).await;
  resolve_doc_result(result)
}

#[get("/countries")]
pub async fn countries(app_data: web::Data<crate::AppState>) -> impl Responder {
  let result = web::block(move || app_data.core.get_countries()).await;
  resolve_collection_result(result)
}

#[get("/pending-countries")]
pub async fn pending_countries(app_data: web::Data<crate::AppState>) -> impl Responder {
  let result = web::block(move || app_data.core.get_pending_countries()).await;
  resolve_collection_result(result)
}

#[get("/currencies")]
pub async fn currencies(app_data: web::Data<crate::AppState>) -> impl Responder {
  let result = web::block(move || app_data.core.get_currencies()).await;
  resolve_collection_result(result)
}

fn resolve_collection_result(
  result: Result<Vec<Document>, BlockingError<Error>>,
) -> impl Responder {
  match result {
    Ok(result) => HttpResponse::Ok().json(result),
    Err(e) => {
      println!("Resolve collection error: {:?}", e);
      HttpResponse::InternalServerError().finish()
    }
  }
}

fn resolve_doc_result(result: Result<Option<Document>, BlockingError<Error>>) -> impl Responder {
  match result {
    Ok(result) => match result {
      Some(result) => HttpResponse::Ok().json(result),
      None => HttpResponse::NotFound().json(bson::doc! {"msg":"Not Found"}),
    },
    Err(e) => {
      println!("Resolve doc error: {:?}", e);
      HttpResponse::InternalServerError().finish()
    }
  }
}
