module.exports=middleware = (req,resp,next)=>{
    // console.log('reqFilter');
    // next();

    // // age filter middleware example
    // if(!req.query.age){
    //     resp.send("Please Provide age");
    // }else if(req.query.age < 18){
    //     resp.send("You cannot access this page");
    // }else{
    //     next();
    // }

    const bearerHeader = req.headers['authorization'];
    if (bearerHeader) {
        const bearerToken = bearerHeader.split(" ");
        const getToken = bearerToken[1];
        req.token = getToken;
        next();
    } else {
        resp.status(401).json({ message: "Authorization token is missing or wrong." });
    }
}