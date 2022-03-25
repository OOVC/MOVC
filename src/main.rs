use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use std::env;

mod controller;
mod movc_core;

pub struct AppState {
    core: movc_core::Core,
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "80".to_string())
        .parse()
        .expect("PORT must be a number");

    let client_options = mongodb::options::ClientOptions::parse(
        env::var("MONGODB_URI").expect("SHould have mongodb uri"),
    )
    .unwrap();
    let client = mongodb::sync::Client::with_options(client_options).unwrap();
    let db = client.database("movc");

    HttpServer::new(move || {
        App::new()
            .data(AppState {
                core: movc_core::Core::new(&db),
            })
            .service(controller::country)
            .service(controller::countries)
    })
    .bind(("0.0.0.0", port))
    .expect("Can not bind to port 8000")
    .run()
    .await
}
