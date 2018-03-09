const model = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');
const process = require('process');

/**
 * Muestra la ayuda.
 */
exports.helpCmd= rl => {
    log("Comandos:");
    log("h|help - Muestra esta ayuda.");
    log("list - Listar los quizzes existentes.");
    log("show <id> - Muestra la pregunta y la respuesta del quiz indicado");
    log("add - Añadir un nuevo quiz interactivamente.");
    log("delete <id> - Borrar el quiz indicado");
    log("edit <id> - Editar el quiz indicado.");
    log("test <id> - Probaruiz indicado");
    log("p|play - Juegar a preguntar aleatoriamente todos los quizzes.");
    log("credits - Creditos.");
    log("q|quit - Salir del programa.");
    rl.prompt()
};


/**
 * Lista todos los quizzes existentes en el modelo.
 */
exports.listCmd= rl =>{

    model.getAll().forEach((quiz, id) => {
        log(`  [${colorize(id,'magenta')}]: ${quiz.question}`);
    });

    rl.prompt();
};


/**Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 *@param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl,id) =>{

    if (typeof id === "undefined") {
        errorlog("Falta el parámetro id.");
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(`   [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize("=>", 'magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};


/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 */
exports.addCmd= rl => {

    rl.question(colorize('  Introduzca una pregunta: ','red'), question => {

        rl.question(colorize('  Introduzca la respuesta: ','red'), answer=> {

            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>','magenta')} ${answer}`);
            rl.prompt();
        });
    });
};


/**
 * Borra un quiz del modelo.
 * @param id clave del quiz a borrar.
 */
exports.deleteCmd = (rl,id) => {

    if (typeof id === "undefined") {
        errorlog("Falta el parámetro id.");
    } else {
        try {
            model.deleteByIndex(id);
        } catch (error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 * Edita un quiz del modelo.
 * @param id clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl,id) =>{
    if( typeof id === "undefined"){
        errorlog('Falta el parámetro id.');
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            rl.question(colorize('  Introduzca una pregunta: ','red'), question => {
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                rl.question(colorize('  Introduzca la respuesta: ','red'),answer=>{
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz  ${colorize(id, 'magenta')} por: ${question} ${colorize('=>','magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/**
 * Prueba un quiz, hace una pregunta del modelo a la que debemos contestar
 * @param id clave del quiz a probar.
 */
exports.testCmd = (rl,id) =>{
    if (typeof id === "undefined"){
        errorlog('Falta el parámetro id.');
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            rl.question(colorize(`${quiz.question}?: `,'magenta'), resp => {
                resp = resp.toLowerCase().trim();
                if(resp === quiz.answer.toLowerCase().trim()) {
                    log('Su respuesta es correcta.');
                    biglog('CORRECTO', 'green');
                } else{
                    log('Su respuesta es incorrecta.');
                    biglog('INCORRECTO','red');
                }
                rl.prompt();
            });
        } catch(error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
    rl.prompt();
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si contesta todo satisfactoriamente.
 */
exports.playCmd= rl => {

    let score = 0;
    let toBeResolved = [];

    for(let i = 0; i < model.count(); i++)
        toBeResolved[i] = i;

    const playOne = () => {

        if (toBeResolved.length === 0){
            log('No hay más preguntas.','red');
            log(`Final del juego. Correctas: ${score}`);
            biglog(`${score}`, 'green');
            rl.prompt();
        } else {
            let id = Math.floor(Math.random() * toBeResolved.length);
            let quiz = model.getByIndex(toBeResolved[id]);
            toBeResolved.splice(id, 1);

            rl.question(colorize(`${quiz.question}?: `,'magenta'), resp => {
                resp = resp.toLowerCase().trim();
                if(resp=== quiz.answer.toLowerCase().trim()){
                    ++score;
                    log(`CORRECTO - Lleva ${score} aciertos.`,'green');
                    playOne();
                } else{
                    log(`INCORRECTO.`, 'red');
                    log(`Final del juego. Correctas: ${score}`);
                    biglog(`${score}`,'green');
                }
                rl.prompt();}
            );
        }
    };
    playOne();
    rl.prompt();
};

/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd= rl =>{
    log('Autores de la práctica.');
    log('Carlos Gurucharri.', 'green');
    log('Paula Diaz.', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 */
exports.quitCmd = rl =>{
    rl.close();
};