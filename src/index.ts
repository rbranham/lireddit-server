import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, usingStudio, __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import expressSession from "express-session";
import connectPg from "connect-pg-simple";
import { MyContext } from "./types";
import cors from "cors";

require("dotenv").config();

const pgSession = connectPg(expressSession);

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  if(!usingStudio){ // This is to disalble cors when using apollo studio
    app.use(
      cors({
        origin: "http://localhost:3000",
        credentials: true,
      })
    );
  }

  app.use(
    expressSession({
      name: COOKIE_NAME,
      store: new pgSession({
        disableTouch: true,
        createTableIfMissing: true,
        conString: "postgres://postgres:password@localhost:5432/lireddit", // https://stackoverflow.com/questions/46484235/how-to-specify-the-connection-string-in-connect-pg-simple
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf, TODO: google this later
        secure: __prod__, // Cookie only works in https
      },
      saveUninitialized: false,
      secret: "asdfqwerlk;jsadfc",
      resave: false,
      // Insert express-session options here
    })
  );

  const apolloServer = new ApolloServer({
    introspection: true, 
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: usingStudio });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.log(err);
});
