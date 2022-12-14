import { Request, Response } from 'express';
import { validator } from '../libs/validator';
import { registerUserSchema } from '../schemas/userSchemas';
import UserService from '../services/UserService';
import PasswordService from '../services/PasswordService';
import TokenService from '../services/TokenService';
import CookieService from '../services/CookieService';
import { LOGOUT_SUCCESS } from '../constants/successMessages';
import {
  PASSWORD_NOT_CORRECT,
  USER_EXISTS,
  USER_NOT_EXISTS,
  USER_NOT_FOUND,
} from '../constants/errorMessages';

class AuthController {
  /**
   * Register
   * @param req
   * @param res
   */
  public static async register(req: Request, res: Response): Promise<void> {
    const userData = req.body;
    const { email } = userData;
    let user = await UserService.findByEmail(email);

    if (user) {
      res.status(400).json({ message: USER_EXISTS });
      return;
    }

    const errors = validator.validate(userData, registerUserSchema);

    if (errors) {
      res.status(400).json({ errors });
      return;
    }

    user = await UserService.create(userData);

    const { access_token, expires_in } = await TokenService.generateAccessToken(user);
    CookieService.setAuthCookie(res, access_token, expires_in);

    res.json({ user, access_token });
  }

  /**
   * Login
   * @param req
   * @param res
   */
  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);

    if (!user) {
      res.status(401).json({ message: USER_NOT_EXISTS });
      return;
    }

    const isValidPassword = await PasswordService.comparePasswords(password, user.password);

    if (!isValidPassword) {
      res.status(400).json({ message: PASSWORD_NOT_CORRECT });
      return;
    }

    const { access_token, expires_in } = await TokenService.generateAccessToken(user);
    CookieService.setAuthCookie(res, access_token, expires_in);

    res.json({ user, access_token });
  }

  /**
   * Current authorized user
   * @param req
   * @param res
   */
  public static async me(req: Request, res: Response): Promise<void> {
    const user = req.user;

    if (!user) {
      res.status(404).send({ message: USER_NOT_FOUND });
      return;
    }

    res.send(user);
  }

  /**
   * Logout
   * @param req
   * @param res
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    CookieService.clearAuthCookie(res);
    res.send({ message: LOGOUT_SUCCESS });
  }
}

export default AuthController;
