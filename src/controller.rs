use actix_web::{get, web, HttpResponse, Responder};

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

#[get("/countries")]
pub async fn countries(app_data: web::Data<crate::AppState>) -> impl Responder {
  let result = app_data.core.get_countries();
  HttpResponse::Ok().json(result)
}
