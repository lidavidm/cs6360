package server;

import static spark.Spark.*;

/**
 * Created by lidavidm on 2/10/16.
 */
public class WashiServer {
    public static void main(String[] args) {
        staticFileLocation("/static");

        get("/", (request, response) -> {
            response.redirect("/index.html");
            return "";
        });
    }
}
