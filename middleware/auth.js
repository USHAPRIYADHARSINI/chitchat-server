import jwt from "jsonwebtoken"

export const auth = (request,response,next) => {
     try{
        const token = request.header("Authorization")
        console.log(request)
        console.log("token is :", token)
        jwt.verify(token, process.env.SECRET_KEY);
        next();
    } catch(err){
        response.status(401).send({error:err.message})
    }
   
}