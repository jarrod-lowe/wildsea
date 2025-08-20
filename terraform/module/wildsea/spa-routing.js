function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // If the URI doesn't contain a file extension and isn't the root
    // redirect to index.html to let React Router handle it
    if (!uri.includes('.') && uri !== '/') {
        request.uri = '/index.html';
    }
    
    return request;
}