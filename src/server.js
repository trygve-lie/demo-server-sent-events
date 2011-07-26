var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var sys = require('sys');



// Simple http server

server = http.createServer( function ( request, response ){


    // Capture Server Sent Events at /status/live

    if ( request.headers.accept && request.headers.accept === 'text/event-stream' ) {

        if ( request.url === '/status/live' ) {
            server.sseSend( request, response );
        } else {
            server.status404( response, request.url );
        }


    // Everything else are plain HTTP requests

    } else {


        // XHR fallback for non SSE clients at /status/xhr

        if ( request.url === '/status/xhr' ) {
            //this.status200( response, serverStatus.info(), 'application/json' );
            return;
        }


        // Serve static html files from the file system

        var uri = url.parse(request.url).pathname;
        var filepath = "www" + uri;
        if (filepath.substring(filepath.length - 1) === '/') {
            filepath  += 'index.html';
        }

        path.exists(filepath, function ( ex ) {

            if (!ex) {
                server.status404( response, uri );
                return;
            }

            fs.readFile(filepath, "binary", function ( error, fileContent ) {

                if (error) {
                    server.status500( response, filepath );
                    return;
                }

                server.status200( response, fileContent, 'text/html' );
            });

        });

    }

});
server.listen(8080);



// Server Sent Events

server.sseSend = function ( request, response ) {
    response.writeHead(200, {
        'Content-Type'  : 'text/event-stream',
        'Cache-Control' : 'no-cache',
        'Connection'    : 'keep-alive'
    });

    /*
    serverStatus.on('tick', function ( ) {
        response.write("data: " + serverStatus.info() + "\n\n");
    });
    */
};



// Status codes

server.status200 = function ( response, data, contentType ) {
    response.writeHead(200, {'Content-Type': contentType});
    response.write(data, "binary");
    response.end();
};

server.status404 = function ( response, data ) {
    response.writeHead(404, {'Content-Type': 'text/html'});
    response.write("404 - File not found: " + data);
    response.end();
};

server.status500 = function ( response, data ) {
    response.writeHead(500, {'Content-Type': 'text/html'});
    response.write("500 - Could not read " + data + " from file system!");
    response.end();
};
