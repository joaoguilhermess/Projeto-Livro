import fetch from "node-fetch";
import path from "path";
import fs from "fs";

const email = "20100092@educargloria.com";
const password = "educar1234#";

const allow = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÆÁÂÂÀÅÃÄÇÐÉÊÈËÍÎÌÏÑÓÔÒØÕÖÞÚÛÙÜÝáâæàåãäçéêèðëíîìïñóôòøõößþúûùüýÿ";

async function fetchSafe(a, b) {
	while (true) {
		try {
			return await fetch(a, b);
		} catch {}
	}
}

class Util {
	static formatNumber(str, len=2) {
		str = str.toString();

		while (str.length < len) {
			str = "0" + str;
		}

		return str;
	}

	static formatString(str) {
		var n = "";

		for (var i = 0; i < str.length; i++) {
			if (allow.includes(str[i])) {
				n += str[i];
			}
		}

		return n;
	}

	static print(page, time, name) {
		var d = new Date(Date.now() - time + 180 * 60 * 1000);
		var t = "";
		var r = "\r";

		if (d.getHours()) {t += Util.formatNumber(d.getHours()) + "h ";}
		if (d.getMinutes()) {t += Util.formatNumber(d.getMinutes()) + "m ";}
		if (d.getSeconds()) {t += Util.formatNumber(d.getSeconds()) + "s ";}
		if (d.getMilliseconds()) {t += Util.formatNumber(d.getMilliseconds(), 4) + "ms";}

		r += "\x1b[33m" + page + "\x1b[0m" + " ";
		r += "\x1b[37m\x1b[1m" + t + "\x1b[0m" + " ";
		r += "\x1b[30m\x1b[1m" + name + "\x1b[0m" + " ";
		// r += "\x1b[32m" + status + "\x1b[0m";

		console.log(r);
	}

	static async Write(p, image) {
		image = await image.arrayBuffer();

		image = Buffer.from(image);

		fs.writeFileSync(p, image);
	}
}

class ProjetoLivro {
	constructor() {
		this.StartTime = Date.now();
		this.pages = 0;
	}

	async Login(email, password) {
		var f = await fetchSafe("https://auth-server.portalsas.com.br/v2/auth", {
			"headers": {
				"accept": "application/json, text/plain, */*",
				"content-type": "application/json",
			},
			"body": "{\"login\":\"" + email + "\",\"password\":\"" + password + "\"}",
			"method": "POST"
		});
		var json = await f.json();

		this.auth = "Bearer " + json.authResponse.token; 
		this.authEncoded = encodeURIComponent(this.auth);
	}

	async getLivros() {
		var list = [];

		var index = 0;

		while (true) {
			var f = await fetchSafe("https://digital-content-bff.sasdigital.com.br/v1/materials?pageNumber=" + index, {
				"headers": {
					"accept": "application/json, text/plain, */*",
					"authorization": this.auth
				},
				"method": "GET"
			});
			var json = await f.json();

			if (index == json.totalPage) {
				break;	
			} else {
				for (var i = 0; i < json.list.length; i++) {
					list.push(json.list[i]);
				}
			
				index += 1;
			}
		}

		return list;
	}

	async getTopics(livroId) {
		var list = [];

		while (true) {
			var f = await fetchSafe("https://digital-content-bff.sasdigital.com.br/v1/materials/" + livroId + "?includeNotVisibleContents=true", {
				"headers": {
					"accept": "application/json, text/plain, */*",
					"authorization": this.auth
				},
				"method": "GET"
			});
			var json = await f.json();

			break;
		}

		for (var i = 0; i < json.topics.length; i++) {
			var contents = json.topics[i].contents;

			for (var l = 0; l < contents.length; l++) {
				if (contents[l].description.split(" ")[0] == "PDF") {
					list.push(contents[l]);
				}
			}
		}

		return list;
	}

	async iterateImages(productId, callback) {
		var index = 1;

		while (true) {
			try {
				var image = await this.getImage(productId, index);

				if (image.status == 500) {
					break;
				} else if (image.status == 200) {
					this.pages++;

					await callback(image, index);

					index++;
				}
			} catch(e) {console.log(e)}
		}
	}

	async getImage(topicId, index) {
		var f = await fetchSafe("https://pageflip.portalsas.com.br/" + topicId + "/files/large/" + index + ".jpg", {
			"headers": {
				"accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
				"cookie": "_hjSessionUser_1632105=eyJpZCI6ImZmMjkwYzFlLWM3NGEtNTk5Zi04MzcyLTg3OGZjOTEwZGE2NCIsImNyZWF0ZWQiOjE2NjMwMzIzMjI2MDQsImV4aXN0aW5nIjp0cnVlfQ==; _hjSessionUser_1651126=eyJpZCI6IjUzZGRhNDNkLWJiYjQtNWUyMy1hYWQ5LTllYTRkMzI2NWUyMyIsImNyZWF0ZWQiOjE2NjMyODM2NzI1MTUsImV4aXN0aW5nIjp0cnVlfQ==; _gid=GA1.3.1881415274.1670011367; _hjSession_1632105=eyJpZCI6ImU2Y2QwMTVjLTUyMGEtNGU0Zi04ZDk4LWNmNzMxNDM1NzY3ZSIsImNyZWF0ZWQiOjE2NzAwMTEzNjc5MjEsImluU2FtcGxlIjpmYWxzZX0=; token=" + this.authEncoded + "; strategy=token; session=IRna1w67UbJzXfvx-zE1oOhrvfUcAcCm; refreshToken=O0Z2Cc9cUOehtbnqO2gf2lGOJhvlsO1rUc-SMWASaoGrMtd-E5PWRh5sg-vY6BDouPftZOv1Ia04q5dzqxlYhKyHtqRO_5gvTVNHCKm7d36ex6fNaZVisKVU0YfihIKzXNvxYo-wm4ojKFX8xaMkSxbbMZIw82OsdV71Wx6HEMA; _ga=GA1.3.310238777.1663032322; _ga_4ZXGB89LRC=GS1.1.1670011367.13.1.1670011384.0.0.0"
			},
			"method": "GET"
		});

		return f;
	}

	async saveImage(p, image, index) {
		var f = path.join(p, index + ".jpg");

		Util.print(this.pages, this.StartTime, f);

		var length = parseInt(image.headers.get("content-length"));

		if (fs.existsSync(f)) {
			if (fs.statSync(f).size != length) {
				await Util.Write(f, image);
			}
		} else {
			await Util.Write(f, image);
		}
	}
}

var projetoLivro = new ProjetoLivro();

var current = 0;

var max = 10;

async function main() {
	await projetoLivro.Login(email, password);
	
	var livros = await projetoLivro.getLivros();

	for (var a = 0; a < livros.length; a++) {
		var topics = await projetoLivro.getTopics(livros[a].id);

		var release;

		for (var b = 0; b < topics.length; b++) {
			if (current >= max) {
				await new Promise(function(resolve, reject) {
					release = resolve;
				});
			}

			var promise = new Promise(async function(resolve, reject) {
				current += 1;
				var livro = Util.formatString(livros[a].name);
				var name = Util.formatString(topics[b].name);

				if (!fs.existsSync(livro)) {
					fs.mkdirSync(livro);
				}

				var p = path.join(livro, name);

				if (!fs.existsSync(p)) {
					fs.mkdirSync(p);
				}

				await projetoLivro.iterateImages(topics[b].productId, function(image, index) {
					projetoLivro.saveImage(p, image, index);
				});

				current -= 1;
				
				release();
			});
		}
	}
}

main();