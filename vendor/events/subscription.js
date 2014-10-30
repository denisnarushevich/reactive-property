function Subscription(token, handler, data, once){
    this.handler = handler;
    this.data = data;
    this.once = once || false;
    this.token = token;
}

Subscription.prototype.token = -1;
Subscription.prototype.handler = null;
Subscription.prototype.data = null;
Subscription.prototype.once = null;

module.exports = Subscription;