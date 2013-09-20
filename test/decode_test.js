//for browser compatibility
if(!chai)   var chai = require('chai');
if(!fernet) var fernet = require('../fernet');

var assert = chai.assert;

var testData = {
  "token": "gAAAAAAdwJ6wAAECAwQFBgcICQoLDA0ODy021cpGVWKZ_eEwCGM4BLLF_5CV9dOPmrhuVUPgJobwOz7JcbmrR64jVmpU4IwqDA==",
  "now": "1985-10-26T01:20:00-07:00",
  "iv": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  "src": "hello",
  "secret": "cw_0x689RpI-jtRR7oE8h_eQsKImvJapLeSbXpwF4e4="
}

suite('fernet.Token.prototype.decode', function(){
  var _fernet = new fernet({ttl: 0})
  var secret  = new fernet.Secret(testData.secret);

  test("decode()", function(){
    var token = new _fernet.Token({
      secret: secret,
      token: testData.token
    })

    assert.equal("hello", token.decode())
    assert.equal("hello", token.toString())
  })

  test("decode(token)", function(){
    var token = new _fernet.Token({secret: secret})
    assert.equal("hello", token.decode(testData.token))
    assert.equal("hello", token.toString())
  })

  test("decode(token) with top-level secret", function(){
    var f = new fernet({secret: testData.secret, ttl: 0})
    var token = new f.Token()
    assert.equal("hello", token.decode(testData.token))
    assert.equal("hello", token.toString())
  })

  test('recovers version', function(){
    var token = new _fernet.Token({
      secret: secret,
      token: testData.token,
      version: 1
    })
    assert.equal(token.version, 1);
    token.decode();
    assert.equal(token.version, 128);
  })

  test('recovers time', function(){
    var token = new _fernet.Token({
      secret: secret,
      token: testData.token
    })
    token.decode();
    var now = new Date(Date.parse(testData.now));
    assert.equal(token.time.toUTCString(), now.toUTCString());
  })

  test('recovers iv', function(){
    var token = new _fernet.Token({
      secret: secret,
      token: testData.token
    })
    token.decode();
    var ivHex = fernet.ArrayToHex(testData.iv);
    assert.equal(token.ivHex, ivHex);
  })

  test('recovers hmac', function(){
    var token = new _fernet.Token({
      secret: secret,
      token: testData.token
    })
    token.decode();
    var computedHmac = fernet.createHmac(secret.signingKey, fernet.timeBytes(token.time), token.iv, token.cipherText);
    assert.equal(token.hmacHex, computedHmac.toString(fernet.Hex));
  })

  test('raises new Error("Invalid Token: TTL") on invalid ttl', function(){
    var token = new fernet.Token({
      secret: secret,
      token: testData.token,
      ttl: 1
    })

    assert.throws(function(){
      token.decode();
    }, Error, 'Invalid Token: TTL');
  })

  test('inherits parent TTL', function(){
    var f     = new fernet({ttl: 1});
    var token = new f.Token({
      secret: secret,
      token: testData.token,
    })

    assert.throws(function(){
      token.decode();
    }, Error, 'Invalid Token: TTL');
  })

  test('raises new Error("Invalid Token: HMAC") on wrong Hmac', function(){
    var s = testData.token;
    var i = s.length - 5;
    var mutation = String.fromCharCode(s.charCodeAt(i) + 1);
    var dirtyHmacString = s.slice(0,i) + mutation + s.slice(i+1);
    var token = new _fernet.Token({
      secret: secret,
      token: dirtyHmacString
    })

    assert.throws(function(){
      token.decode();
    }, Error, 'Invalid Token: HMAC');
  })
})
