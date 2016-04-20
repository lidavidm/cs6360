// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

extern crate hyper;
extern crate iron;
#[macro_use]
extern crate router;
extern crate uuid;

use iron::prelude::*;
use iron::{status, AfterMiddleware};

struct CorsMiddleware;

impl AfterMiddleware for CorsMiddleware {
    fn after(&self, req: &mut Request, mut res: Response) -> IronResult<Response> {
        res.headers.set(hyper::header::AccessControlAllowOrigin::Any);
        Ok(res)
    }
}

fn uuid(_: &mut Request) -> IronResult<Response> {
    let uuid = format!("{}", uuid::Uuid::new_v4());
    Ok(Response::with((status::Ok, uuid)))
}

fn main() {
    let router = router!(
        get "/uuid" => uuid
    );
    let mut chain = Chain::new(router);
    chain.link_after(CorsMiddleware);
    Iron::new(chain).http("localhost:3000").unwrap();
}
