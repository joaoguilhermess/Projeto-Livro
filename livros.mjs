import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const email = "20100092@educargloria.com";
const password = "educar1234#";

var startTime = Date.now();

var il = 0;

var auth = "";

async function login() {
	var f = await fetch("https://auth-server.portalsas.com.br/v2/auth", {
		"headers": {
			"accept": "application/json, text/plain, */*",
			"content-type": "application/json",
		},
		"body": "{\"login\":\"" + email + "\",\"password\":\"" + password + "\"}",
		"method": "POST"
	});
	var json = await f.json();

	return "Bearer " + json.authResponse.token; 
}

async function main() {
	auth = await login();

	var livros = await getLivros();

	for (var i = 0; i < livros.length; i++) {
		await Topics(livros[i].id, livros[i].name);
	}
}

main();

async function getLivros() {
	try {
		var l = [];

		var k = 0;

		while (true) {
			while (true) {
				try {
					var f = await fetch("https://digital-content-bff.sasdigital.com.br/v1/materials?pageNumber=" + k, {
						"headers": {
							"accept": "application/json, text/plain, */*",
							"authorization": auth 
						},
						"method": "GET"
					});
					var json = await f.json();
					break;
				} catch (e) {/*console.error(e);*/}
			}

			if (k == json.totalPage) {
				break;
			}

			for (var i = 0; i < json.list.length; i++) {
				l.push(json.list[i]);
			}

			k += 1;
		}

		return l;
	} catch (e) {
		console.log(e + "\n");
	}
}

async function Topics(id, livro) {
	try {
		while (true) {
			try {
				var f = await fetch("https://digital-content-bff.sasdigital.com.br/v1/materials/" + id + "?includeNotVisibleContents=true", {
					"headers": {
						"accept": "application/json, text/plain, */*",
						"authorization": auth
					},
					"method": "GET"
				});
				var json = await f.json();
		
				break;
			} catch (e) {/*console.error(e);*/}
		}

		for (var i = 0; i < json.topics.length; i++) {
			var contents = json.topics[i].contents;

			for (var l = 0; l < contents.length; l++) {
				if (contents[l].description.split(" ")[0] == "PDF") {
					await InitPDF(contents[l].productId, livro, contents[l].name);
				}
			}
		}
	} catch (e) {
		console.log(e + "\n");
	}
}

async function InitPDF(id, livro, name) {
	try {
		var i = 0;

		while (true) {
			i += 1;

			var img = await getImage(id, i);

			if (img.status == 500) {
				break;
			}

			if (img.status == 200) {
				await savePage(img, id, i, livro, name);
				
				il += 1;
			}
		}

	} catch (e) {
		console.log(e + "\n");
	}
}

async function getImage(id, n) {
	try {
		while (true) {
			try {
				var f = await fetch("https://pageflip.portalsas.com.br/" + id + "/files/large/" + n + ".jpg", {
					"headers": {
						"accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
						"cookie": "_gid=GA1.3.1470628385.1669639167; ln_or=d; _hjFirstSeen=1; _hjSession_1632105=eyJpZCI6IjExMTNjNTEzLWQ3MDktNDE3NS04MzRlLWQyMTBhN2EyMTkzOSIsImNyZWF0ZWQiOjE2Njk2MzkxNjgwOTksImluU2FtcGxlIjpmYWxzZX0=; token=" + encodeURIComponent(auth) + "; strategy=token; session=GFL8fGeCM67q7JfJZL95aBIe8RNX6XUu; refreshToken=aLqt956L5cF3zznybzHh8M1AQ6Y9tC7VuASJ2Kz7DoO3d-ghq6cLL1X8gRb9B_FbjTlgoIAR_Jx3dQdwObZ7Ye3KUm6iQiz_aCCI--V3ALsicbQWftq2RO7n4QNKs5wFcYh8hUsFF1BcNUDH1H1bdSqTL3FBtnMFwaWDnKT7WL0; _hjSessionUser_1632105=eyJpZCI6IjNiOTYyMWRmLThjNzEtNTAwMi1hNDA2LWI0OTlkNjEzNmFhNyIsImNyZWF0ZWQiOjE2Njk2MzkxNjgwNjYsImV4aXN0aW5nIjp0cnVlfQ==; _ga=GA1.3.1633265526.1669639167; _gat_UA-151320494-8=1; _ga_4ZXGB89LRC=GS1.1.1669639166.1.1.1669639244.0.0.0"
					},
					"method": "GET"
				});

				// print(il, id, n, f.status);

				return f;
			} catch (e) {/*console.error(e);*/}
		}
	} catch (e) {
		console.log(e + "\n");
	}
}

async function print(il, id, n, status) {
	var r = "\r";

	r += "\x1b[33m" + il + "\x1b[0m" + " ";
	r += "\x1b[37m\x1b[1m" + elapsed() + "\x1b[0m" + " ";
	r += "\x1b[30m\x1b[1m" + id + "\x1b[0m" + " ";
	r += "\x1b[31m" + n + ".jpg" + "\x1b[0m" + " ";
	r += "\x1b[32m" + status + "\x1b[0m";

	while (r.length - 50 < process.stdout.columns) {
		r += " ";
	}

	console.log(r);

	// process.stdout.write(r);
}

async function savePage(page, id, i, livro, name) {
	try {
		livro = formatName(livro);
		name = formatName(name);

		if (!fs.existsSync(livro)) {
			fs.mkdirSync(livro);
		}

		name = path.join(livro, name);
		if (!fs.existsSync(name)) {
			fs.mkdirSync(name);
		}

		var p = path.join(name, i + ".jpg");

		fs.writeFileSync(p, page);
		return;

		// return new Promise(function(resolve, reject) {
		// 	if (!fs.existsSync(p)) {
		// 		// var stream = fs.createWriteStream(p);

		// 		// console.log("a");

		// 		// stream.on("end", function() {
		// 		// 	print(il, id, i, page.status);
		// 		// 	resolve();
		// 		// });

		// 		// page.body.pipe(stream);

		// 		print(il, id, i, page.status);
		// 		fs.writeFileSync(p);
		// 		resolve();
		// 	} else {
		// 		print(il, id, i, page.status);
		// 		resolve();
		// 	}
		// });

		// if (fs.existsSync(p)) {
		// 	// var stat = fs.statSync(p);

		// 	var stream = fs.createWriteStream(p);

		// 	img.body.pipe(stream);
		// } else {
		// 	var stream = fs.createWriteStream(p);

		// 	img.body.pipe(stream);
		// }
	} catch (e) {
		console.log(e + "\n");
	}
}

function format(str, len=2) {
	str = str.toString();

	while (str.length < len) {
		str = "0" + str;
	}

	return str;
}

function elapsed() {
	var d = new Date(Date.now() - startTime + 180 * 60 * 1000);

	var t = "";

	if (d.getHours()) {
		t += format(d.getHours()) + "h ";
	}

	if (d.getMinutes()) {
		t += format(d.getMinutes()) + "m ";
	}

	if (d.getSeconds()) {
		t += format(d.getSeconds()) + "s ";
	}

	if (d.getMilliseconds()) {
		t += format(d.getMilliseconds(), 4) + "ms";
	}

	return t;
}

const allow = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÆÁÂÂÀÅÃÄÇÐÉÊÈËÍÎÌÏÑÓÔÒØÕÖÞÚÛÙÜÝáâæàåãäçéêèðëíîìïñóôòøõößþúûùüýÿ";

function formatName(name) {
	var n = "";

	for (var i = 0; i < name.length; i++) {
		if (allow.includes(name[i])) {
			n += name[i];
		}
	}

	return n;
}