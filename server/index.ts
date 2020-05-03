import app from "./app";

const port = process.env.PORT || 3000;

// Run server listening on specified port
app.listen(port, function() {
    return console.log(`Server is listening on port ${port}`);
});
