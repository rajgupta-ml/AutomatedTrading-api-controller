// -- Todo's 

import express, { NextFunction } from "express";
import { UserServices } from "../services/UserHandler.services";
import { IAuthController, IUserLogin, userRegistrationDetail } from "../interfaces/IAuthController";
import { UnauthorizedUser } from "../errors/UnauthorizedUser.error";
import { IDataToBeRegistered } from "../interfaces/IDataToBeRegistered";
import { responseHandlerForSuccess } from "../response/successHandler.response";
import { BrokerService } from "../services/BrokerHandler.services";
import { BrokerSelector } from "../services/brokerSelector.service";
import { validateUserDetails } from "../helpers/dataValidation.helper";
import { IMicroServiceCaller } from "../interfaces/IMicroServiceCaller.interface";
import { responseHandlerForError } from "../response/errorHandler.response";



export class AuthController implements IAuthController {
    // Creating a cipher Manager Instance for encryption and decryption
    private userServices: UserServices;
    private brokerServices: BrokerService;
    private brokerSelector: BrokerSelector;
    private microServiceCaller: IMicroServiceCaller
    constructor(userServices: UserServices, brokerServices: BrokerService, brokerSelector: BrokerSelector, microServiceCaller: IMicroServiceCaller) {
        this.userServices = userServices
        this.brokerServices = brokerServices
        this.brokerSelector = brokerSelector
        this.microServiceCaller = microServiceCaller;
    }

    async userRegister(request: express.Request, response: express.Response, next: express.NextFunction): Promise<void> {
        try {
            const userDetails: userRegistrationDetail = { ...request.body };
            //Handling the registration 
            const result = await this.userServices.userRegister(userDetails);
            // Sending the response
            return responseHandlerForSuccess(response, result);
        } catch (error) {
            next(error);
        }

    }
    async userLogin(request: express.Request, response: express.Response, next: NextFunction): Promise<void> {

        try {
            const userDetails: IUserLogin = { ...request.body };
            // Handling the Authentication 
            const result = await this.userServices.userLogin(userDetails);
            //sending the response
            return responseHandlerForSuccess(response, result);
        } catch (error) {
            next(error);
        }
    }


    async brokerRegistration(request: express.Request, response: express.Response, next: express.NextFunction) {
        try {
            const token = request.cookies["set-cookie"];
            const DataToBeRegistered: IDataToBeRegistered = { ...request.body }
            if (!token) throw new UnauthorizedUser("You can't access this link")
            const result = await this.userServices.brokerRegistration(DataToBeRegistered, token);
            return responseHandlerForSuccess(response, result);
        } catch (error) {
            next(error);
        }
    }

    async getOAuthURI(request: express.Request, response: express.Response, next: express.NextFunction) {
        try {
            const token = request.cookies["set-cookie"];
            const { brokerName, userID } = request.body;
            if (!token) throw new UnauthorizedUser("Unauthorized User");
            if (!brokerName || !userID) throw new Error("Broker is required field");
            const brokerInstance = this.brokerSelector.getBroker(brokerName);
            this.brokerServices.setBrokerInstance(brokerInstance);
            const result = await this.brokerServices.getOAuthURI(brokerName, userID, token);
            return responseHandlerForSuccess(response, result);
        } catch (error) {
            next(error);
        }

    }


    async getAccessToken(request: express.Request, response: express.Response, next: express.NextFunction) {

        try {
            const token = request.cookies["set-cookie"];
            if (!token) throw new UnauthorizedUser("Unauthorized User");
            validateUserDetails(request.body, ["userID", "code", "brokerName"]);
            const brokerInstance = this.brokerSelector.getBroker(request.body.brokerName);
            this.brokerServices.setBrokerInstance(brokerInstance);
            const result = await this.brokerServices.getAccessToken(request.body, token);
            return responseHandlerForSuccess(response, result);
        } catch (error) {
            next(error)
        }
    }


    async startDataDigestion(request: express.Request, response: express.Response, next: express.NextFunction) {

        try {
            const token = request.cookies["set-cookie"];
            if (!token) throw new UnauthorizedUser("UnAuthorized User");
            validateUserDetails(request.body, ["access_token", "password"]);
            const result = await this.microServiceCaller.startDataDigestion(request.body.access_token);
            return responseHandlerForSuccess(response, result)
        } catch (error) {
            next(error)
        }
    }

}
