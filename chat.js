//#region Require
const fs = require('fs');
const colors = require('colors')
const pressAnyKey = require('press-any-key');
const CFonts = require('cfonts');
const { AuthPrompt } = require('enquirer');
const { Select } = require('enquirer');
const { AutoComplete } = require('enquirer');
const { Input } = require('enquirer');
const { Toggle } = require('enquirer');
//#endregion

//#region Login
let rawdata = fs.readFileSync('account.json');
var account = JSON.parse(rawdata);

function authenticate(value, state) {
    var acc = account.filter(elem => elem.username == value.username && elem.password == value.password);
    if (acc.length > 0)
        return [true, acc[0].username, acc[0].id]
    else
        return [false]
}

async function Login() {
    var login = false;
    const CustomAuthPrompt = AuthPrompt.create(authenticate);
    const FormLogin = new CustomAuthPrompt({
        name: 'password',
        message: 'Inserisci le tue credenziali:',
        choices: [
            { name: 'username', message: 'Username: ', initial: '...' },
            { name: 'password', message: 'Password: ', initial: '***' }
        ]
    });

    await FormLogin.run()
        .then(answer => login = answer)
        .catch(console.error)

    return login;
}
//#endregion

//#region Opzioni
async function Opzioni() {
    var opzioni = false;
    const FormOpzioni = new Select({
        name: 'opzioni',
        message: 'Cosa vuoi fare?',
        choices: ['leggi messaggi', 'invia messaggio', 'elimina messaggio', 'exit']
    });

    await FormOpzioni.run()
        .then(answer => opzioni = answer)
        .catch(console.error)

    return opzioni;
}
//#endregion

//#region Leggi Messaggi
async function LeggiMsg(user) {
    var scelta = await ScegliLegMsg(user[2]);
    if (scelta != false) {
        if (scelta != "NO") {
            id = parseInt(scelta.split(",")[0]);

            let rawdata = fs.readFileSync('msg.json');
            var messaggi = JSON.parse(rawdata);

            msg = messaggi.find(elem => elem.id === id);

            console.log("Mittente: ", msg.mit);
            console.log("Messaggio: \n" + msg.msg);
            console.log("");
            await pressAnyKey("Premi un tasto per uscire dal messaggio")
                .then()
        }
    } else
        await pressAnyKey("Nessun messaggio trovato")
        .then()
}

function LsLettMsg(userid) {
    let rawdata = fs.readFileSync('msg.json');
    var messaggi = JSON.parse(rawdata);
    var lista = []

    var msg = messaggi.filter(elem => elem.id_des == userid)
    lista = msg.map(elem => [elem.id, elem.mit].join(", "))

    return lista;
}

async function ScegliLegMsg(userid) {
    var scegli = false;
    var scelte = LsLettMsg(userid);
    if (scelte.length > 0) {
        const FormOpzioni = new Select({
            name: 'opzioni',
            message: 'Quale msg vuoi leggere: ',
            choices: scelte
        });
        scegli = "NO";

        await FormOpzioni.run()
            .then(answer => scegli = answer)
            .catch(console.error)
    }

    return scegli;
}
//#endregion

//#region Scrivi Messaggio
async function ScriviMsg(user) {
    var scelta = await ScegliUtente();
    if (scelta != false) {
        console.log("Stai scrivendo a: ", scelta);
        var msg = await InserisciMsg();
        if (msg != false) {
            let rawdata = fs.readFileSync('msg.json');
            var messaggi = JSON.parse(rawdata);
            let max = 0;
            messaggi.forEach(elem => {
                if (elem.id > max) {
                    max = elem.id;
                }
            });
            max++;

            messaggi.push({
                "id": max,
                "id_mit": user[2],
                "mit": user[1],
                "id_des": parseInt(scelta.split(", ")[1]),
                "msg": msg.replace(' \\n', '\n')
            });

            fs.writeFileSync("msg.json", JSON.stringify(messaggi));
        }
    }
}

function CreaLista() {
    lista = [];
    for (let key in account)
        lista.push(account[key].username + ", " + account[key].id);

    return lista;
}

async function ScegliUtente() {
    var scegli = false;
    var scelte = CreaLista();

    const FormScegli = new AutoComplete({
        name: 'scelta',
        message: 'A che utente vuoi scrivere: ',
        limit: Math.min(scelte.length, 10),
        initial: 0,
        choices: scelte
    });

    await FormScegli.run()
        .then(answer => scegli = answer)
        .catch(console.error)

    return scegli;
}

async function InserisciMsg() {
    var msg = false;
    const FormMsg = new Input({
        message: 'Messaggio (\\n per andare a capo): '
    });

    await FormMsg.run()
        .then(answer => msg = answer)
        .catch(console.error)

    return msg;
}
//#endregion

//#region  Elimina Messaggio
async function EliminaMsg(user) {
    var scelta = await ScegliDelMsg(user[2]);

    if (scelta != false) {
        if (scelta != "NO") {
            let rawdata = fs.readFileSync('msg.json');
            var messaggi = JSON.parse(rawdata);
            var index = messaggi.findIndex(elem => elem.id == parseInt(scelta.split(",")[0]));
            if (await ConfirmDel(index)) {
                messaggi.splice(index, 1);
                fs.writeFileSync("msg.json", JSON.stringify(messaggi));
            }
        }
    } else
        await pressAnyKey("Nessun messaggio trovato")
        .then()
}

async function ConfirmDel(idmsg) {
    var confirm;
    let rawdata = fs.readFileSync('msg.json');
    var messaggi = JSON.parse(rawdata);

    const FormConfrim = new Toggle({
        message: 'Sicuro di voler eliminare il messaggio: \n' + messaggi[idmsg].msg + " ?",
        enabled: colors.green('Si'),
        disabled: colors.red('No')
    });

    await FormConfrim.run()
        .then(answer => confirm = answer)
        .catch()

    return confirm;
}

function CreaLsMsg(userid) {
    let rawdata = fs.readFileSync('msg.json');
    var messaggi = JSON.parse(rawdata);
    var lista = []

    var msg = messaggi.filter(elem => elem.id_des == userid)
    lista = msg.map(elem => [elem.id, elem.mit].join(", "))

    return lista;
}

async function ScegliDelMsg(userid) {
    var scegli = false;
    var scelte = CreaLsMsg(userid);
    if (scelte.length > 0) {
        const FormOpzioni = new Select({
            name: 'opzioni',
            message: 'Quale msg vuoi eliminare: ',
            choices: scelte
        });
        scegli = "NO"

        await FormOpzioni.run()
            .then(answer => scegli = answer)
            .catch(console.error)
    }

    return scegli;
}
//#endregion

//#region Main
async function Main() {
    console.clear();
    CFonts.say("MurasakiChat!", {
        font: 'block',
        align: "center",
        gradient: ["#f61cb9", "#1c92f6"]
    })
    await pressAnyKey("")
        .then()
    console.clear();
    login = await Login();
    if (login[0]) {
        console.clear();
        console.log("Accesso Effettuato");
        do {
            console.clear();
            console.log("Benvenuto", login[1]);
            var opzioni = await Opzioni();
            console.clear();
            if (opzioni == "leggi messaggi") {
                await LeggiMsg(login);
            } else if (opzioni == "invia messaggio") {
                await ScriviMsg(login);
            } else if (opzioni == "elimina messaggio") {
                await EliminaMsg(login);
            }
        }
        while (opzioni != "exit" && opzioni != false);
        console.clear();
        console.log(colors.rainbow("Bye Bye!"));
    } else {
        console.clear();
        console.log(colors.red("Accesso Fallito"));
        console.log(colors.rainbow("Bye Bye!"));
    }
}
//#endregion

Main();