import JSEncrypt from "jsencrypt/bin/jsencrypt.min"; // 导入模块
// 密钥对生成工具（如 http://web.chacuo.net/netrsakeypair）
 
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2SSStMwKwRb2XX7HvSVW
/NW/1B7Yud6aD2BtBoSsM+6S45Tg9UKJ7xrx9AJSF4wJ1L0QYPq1dh+LK5crIK43
nN/78yyIQqSVx5NCK1FJOr9+NJ8JfUQSxozepfeAeQ7mOR/1PsHhYAMJhWGbOH5E
NkQwmz82WzJsoyVg7enc1JF/3qVhfP8qpNxKG5E16jp8QewZU+Bi6mZKhUsrGYZZ
oQUGyyk8DJGeUPxOmlEM1V6gxSrvuZacBLueD/QjXO4IhRjS0GOeAqG63JL8woaq
9BV8XTXAB8NTZHusF0u8vprws9kWGqevvs0Ja11q31jVg4m8sH1MxUKT/NXWCb6P
EwIDAQAB
-----END PUBLIC KEY-----`;
 
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2SSStMwKwRb2XX7HvSVW/NW/1B7Yud6aD2BtBoSsM+6S45Tg
9UKJ7xrx9AJSF4wJ1L0QYPq1dh+LK5crIK43nN/78yyIQqSVx5NCK1FJOr9+NJ8J
fUQSxozepfeAeQ7mOR/1PsHhYAMJhWGbOH5ENkQwmz82WzJsoyVg7enc1JF/3qVh
fP8qpNxKG5E16jp8QewZU+Bi6mZKhUsrGYZZoQUGyyk8DJGeUPxOmlEM1V6gxSrv
uZacBLueD/QjXO4IhRjS0GOeAqG63JL8woaq9BV8XTXAB8NTZHusF0u8vprws9kW
Gqevvs0Ja11q31jVg4m8sH1MxUKT/NXWCb6PEwIDAQABAoIBAANEwCqVibHnYRT+
NA5+UeVjaExOnI+LsMD7gBihhaAQfsiLNKmsczwUqUC1ijvNgVZg9C6ph3K8PdGN
qHoI9VBYtMevy2tJY/HJnyzcv9/xAvrSzAdFL40qkK1p4NaxqTiB6SSlMXnLAeku
k3IRwIAanaqwlGZiB22bQe7C3u6aLPfnTE6sKxkm+mqOxhzwEP+DAqc++Z/uDaV3
+mBNZBAWOEricbXpcvcNQFWJzoqqkjqT9A5YvJ7wFYkF6OG9DqNI7AotNh0ALWwG
krEoFb8JArPUK+oORqMbVcFk0ycgG8xmWtVl422Nk61+SEpGltIqzhhK5oBSvyNU
eOps4dUCgYEA3IWAr1L5dk/2iKyBHtbh0rLaxN6BkscMg0MgMZXrtt/UYm+o0TGR
Vr9nWtnFNzU1QpmfUXI2AdDsG7Qo810F8RmnDLm+cqLSXqDvyA5/5lAtIjYMBlH8
U+O1TPv3ZhQ7RNiZbpxPdQZcsITQjJvtmlsbN9GOsJkmP5Xlk+dJuh0CgYEA/BPq
pGsIv4ltVAs8CBll6eU4eNoncVB1RBLn7u5zOevOD+T6GYndaIZ/Lvk2DEIP9rgm
HiLXVWOBiRPs8paxoLzptbbSxEvh71GRHSiZ7oTUkXgH7UrQB9ZrD+YcRhH6Oaw9
IOAeqjE8hDgsphDY2JwjMe8m+cuC1/NNGMU3pu8CgYEAgi6p7lacgFTqZHr56tvO
CpWdgrUcZyrs3xykh8FKmvX+KnJihcSuWTi7ai2/OD1ICN4p6Gn1KhNNH3m25xxW
YqPTMzcAECrA6C43/7FXnf5c9qJTbPO/c0KtCBqDTZbJ+nWn9l1+psYvt+FgQHHY
zdPU+JnUk7qFkuoJ0suqgZ0CgYB7iW83ANWauMkBpTfYaEoP5KxWXeNynxG5OOK9
r9J8klm8ZGVFWtFNRozSAoRAYafdK8ZSgpSxXkC/Yyp+gOewdKS8z0pftSiW1oyd
k6ZMxIBAgmiwHDfzf1ucwRMeK/VLimOy1uNwWQzlZ3pKMHt1PJ/q+t9JEDmhh7VC
7HQntQKBgQCz0Hhrwq/KjNXay5EDSHYACn0+wgd/+n3ih2uIkZ79jsmcnVyOd7a5
JRlxr+dk7Ds8J3Gey2bFgTob4RYyWg9iQjdZyimcn8ib/E80ZmZ7Rn/tS9S2t5lx
H9lu/K7xa3OMS8rcgVsCoBBf1RqBDTS6wU8tgkQqmxycCJsXkTrXcw==
-----END RSA PRIVATE KEY-----`;
 
// 加密
export function encrypt(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey); // 设置公钥
  return encryptor.encrypt(txt); // 对数据进行加密
}
 
// 解密
export function decrypt(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(privateKey); // 设置私钥
  return encryptor.decrypt(txt); // 对数据进行解密
}