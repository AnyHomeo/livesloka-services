const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");


module.exports = (app) => {
  if (process.env.ENVIRONMENT === "DEV") {
    //swagger setup
    const swaggerOptions = {
      definition: {
        openapi: "3.0.0",
        info: {
          version: "1.0.0",
          title: "Livesloka APIS",
          description: "Livesloka API Information",
          contact: {
            name: "Karthik",
          },
          servers: [
            { url: "http://localhost:5000" },
            { url: "https://livekumon-development-services.herokuapp.com" },
          ],
        },
      },
      apis: ["./routes/*.js"],
    };
    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use("/documentation", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }
};
