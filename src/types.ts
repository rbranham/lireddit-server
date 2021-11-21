import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Session } from "express-session";

// Needed for in user.ts. 
// Stack overflow link: 
// https://stackoverflow.com/questions/65108033/property-user-does-not-exist-on-type-session-partialsessiondata 
declare module 'express-session' {
  export interface SessionData {
    userId: Number;
  }
}

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Session };
  res: Response;
};
