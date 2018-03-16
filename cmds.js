const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');
const Sequelize = require('sequelize');
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

    models.quiz.findAll()
        .each(quiz => {
                log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })

    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


/**
 * Devuelve una promesa
 */
const validateId = id => {

    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined"){
            reject(new Error(`Falta el parametro <id>.`));
        }else{
            id = parseInt(id);
            if(Number.isNaN(id)){
                reject (new Error(`El valor del parametro <id> no es un numero`));
            }else{
                resolve(id);
            }
        }
    });
};

/**Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 *@param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl,id) =>{
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


const makeQuestion = (rl,text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
    });
    });
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 */
exports.addCmd= rl => {
    makeQuestion(rl, 'Introduzca una pregunta:')
    .then(q => {
        return makeQuestion(rl, 'Introduzca la respuesta:')
            .then(a => {
                return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


/**
 * Borra un quiz del modelo.
 * @param id clave del quiz a borrar.
 */
exports.deleteCmd = (rl,id) => {

    validateId(id)
    .then(id=> models.quiz.destroy({where:{id}}))
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl .prompt();
    });
};

/**
 * Edita un quiz del modelo.
 * @param id clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl,id) =>{
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }

         process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
        return makeQuestion(rl, 'Introduzca una pregunta:')
        .then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
            return makeQuestion(rl, 'Introduzca la respuesta: ')
            .then(a => {
                quiz.question = q;
                quiz.answer = a;
                return quiz;
            });
        });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz =>  {
        log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Prueba un quiz, hace una pregunta del modelo a la que debemos contestar
 * @param id clave del quiz a probar.
 */
exports.testCmd = (rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz) {
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    return makeQuestion(rl, ' Introduzca la respuesta ')
        .then(a => {
            if(a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                log('Su respuesta es correcta.');
                biglog('CORRECTO','green');
            }else{
                log('Su respuesta es incorrecta.');
                biglog('INCORRECTO','red');
            }
});
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si contesta todo satisfactoriamente.
 */
exports.playCmd = rl => {

    let score = 0;
    let toBeResolved = [];

    const playOne = () => {
        return new Sequelize.Promise((resolve,reject) => {

            if(toBeResolved.length === 0){
            console.log("No hay nada más que preguntar.\nFin del quiz. Aciertos: ");
            resolve();
            return;
        } else {
            let id = Math.floor(Math.random()*toBeResolved.length);
            let quiz = toBeResolved[id];
            toBeResolved.splice(id,1);

            return makeQuestion(rl, quiz.question+'? ')
                .then(a => {
                    if(a.toLowerCase().trim() === quiz.answer.toLowerCase().trim() ){
                        score++;
                        console.log('CORRECTO.\nLleva ',score, 'aciertos');
                        resolve(playOne());
                    }else{
                        console.log("INCORRECTO.\nFin del juego. Aciertos: ");
                        resolve();
                    }
        });
        }
    });
    };

    models.quiz.findAll({raw: true})
        .then(quizzes => {
        toBeResolved = quizzes;
})
.then(() => {
        return playOne();
})
.catch(error => {
        console.log(error);
})
.then(() => {
        biglog(`${score}`,'magenta');
    rl.prompt();
});
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