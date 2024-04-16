const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { validationResult } = require('express-validator');


const { secretKey, PORT } = require('./config.js');
const { User } = require('./models/User.js');
const { Book } = require('./models/Book.js');

const authCheck = require('./middlewares/authCheck.js');
const authAdminCheck = require('./middlewares/authAdminCheck.js');
const adminCheck = require('./middlewares/adminCheck.js');

const checkAuth = require('./middlewares/checkAuth.js');

const bookValidation = require('./validations/bookValidation.js');
const uservalidation = require('./validations/userValid.js');

const app = express();

app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(cookieParser('secret', { httpOnly: true }));
app.use('/images', express.static(__dirname + '/images'));

const start = async () => {
    mongoose.connect('mongodb+srv://mishaplaying:TkSQ7LktafBKkSiP@library.czqfzk0.mongodb.net/?retryWrites=true&w=majority&appName=library');
    console.log();
    try {
        app.listen(PORT, () => {
            console.log('server is running on http://localhost:' + PORT);
        });
        console.log('DB is ok');
    } catch (e) {
        return console.log(e);
    }
}

start();

// hash('login') = $2b$08$RWYtBZ4ys9zZ8ASEH03iw.sxovnPkqyPBd/cZ3jHOQA3ytHkS0AKq


// Список всех пользователей для авторизованных
// app.get('/users', authCheck, async (req, res) => {
//     try {
//         const users = await User.find({});
//         return res.status(200).json({
//             users
//         });
//     } catch (e) {
//         console.log(e);
//         return res.status(500).json({
//             msg: "Не удалось получить список пользователей",
//             error: e
//         });
//     }
// })

app.get('/users/me/role/:token', async (req, res) => {
    const token = req.params.token;
    if (!checkAuth(token)) {
        return res.status(401).json({
            msg: 'Пользователь не авторизован'
        })
    }

    const userId = jwt.verify(token, secretKey).userId;

    const user = await User.findById(userId);
    return res.status(200).json({
        role: user.role
    })
});

app.get('/users/isadmin/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const userId = jwt.verify(token, secretKey).userId;
        const user = await User.findById(userId);
        if (user.role !== "ADMIN") {
            return res.status(401).json({
                msg: "No access"
            })
        }
        return res.status(200).json({
            msg: "OK"
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Server error"
        });
    }
});

app.get('/users/me/:token', async (req, res) => {
    const { token } = req.params;
    let data = {}
    let userId = '';
    try {
        data = jwt.verify(token, secretKey);
        userId = data.userId;
    } catch (e) {
        // console.log(e)
        return res.status(400).json({
            msg: 'Пользователь неавторизован (возможно, некорректный токен)'
        });
    }

    try {
        let user = await User.findById(userId).clone();
        let { hashedPassword, role, ...toSendUser } = user._doc;

        if (!user) {
            return res.status(500).json({
                msg: "Пользователь не найден"
            });
        }
        return res.status(200).json({
            user: toSendUser
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось получить информацию о пользователе",
            error: e.message
        })
    }
})

// Список всех книг для авторизованных
app.get('/books/all/:token', async (req, res) => {
    const { token } = req.params;
    if (!token) {
        return res.status(400).json({
            msg: "Пользователь не авторизован",
            error: e
        });
    }
    try {
        const books = await Book.find({});
        return res.status(200).json({
            msg: "success",
            books: books
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось получить список книг",
            error: e
        });
    }
});

// Список книг пользователя
app.get('/books/my/:token', async (req, res) => {
    const token = req.params.token;
    if (!checkAuth(token)) {
        return res.status(401).json({
            msg: 'Пользователь не авторизован'
        })
    }

    try {
        const userId = await jwt.verify(token, secretKey).userId;
        const user = await User.findById(userId);

        const books = await Book.find({ keeper: user.login })
        // console.log(books);
        return res.status(200).json({
            books
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось получить список книг пользователя",
            error: e.message
        });
    }
});

// Получение книги по id
app.get('/books/:id', authCheck, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        return res.status(200).json({
            msg: "success",
            book: book
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось получить книгу по id",
            error: e.msg
        });
    }
});

// Добавление книги (только админы)
app.patch('/books/:token', bookValidation, async (req, res) => {
    const token = req.params.token;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            msg: "Не удалось добавить книгу (некорректные данные отправлены)",
            errors: errors.array
        });
    }

    if (!adminCheck(token)) {
        return res.status(401).json({
            msg: "Отказано в доступе"
        })
    }
    try {
        const { title } = req.body;
        const { author } = req.body;
        const { year } = req.body;
        const { description } = req.body || '';
        const { imageUrl } = req.body || `http://localhost:${PORT}/images/book.jpg`;
        const { genre } = req.body || '';
        const { keeper } = req.body;

        const book = new Book({
            title,
            author,
            year,
            genre,
            description,
            imageUrl,
            keeper
        });

        await book.save();
        return res.status(200).json({
            msg: "success",
            book
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось добавить книгу",
            error: e.message
        });
    }
});


// обновление книги для админов
app.post('/books/update/:token', async (req, res) => {
    if (!adminCheck(req.params.token)) {
        return res.status(401).json({
            msg: "Откаазно в доступе"
        });
    }

    try {
        const bookId = req.body.id;

        const { title } = req.body;
        const { author } = req.body;
        const { year } = req.body;
        const { keeper } = req.body;

        const newBookData = {
            title, author, year, keeper
        }
        // console.log(newBookData, bookId);

        const book = await Book.findByIdAndUpdate(bookId, newBookData);
        // console.log('ну обновлено')
        return res.status(200).json({
            msg: 'Книга обновлена'
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: 'Не удалось обновить книгу'
        })
    }

});

// только доступные книги
app.get('/books/aviable/:token', async (req, res) => {
    const { token } = req.params;
    if (!checkAuth(token)) {
        return res.status(401).json({
            msg: "Отказано в доступе"
        });
    }
    const books = await Book.find({ keeper: "Библиотека" });
    return res.status(200).json({
        books
    });
});

// Удаление книги по id (только админы)
app.delete('/books/:id/:token', async (req, res) => {
    const { id } = req.params;
    const { token } = req.params;

    try {
        await Book.findByIdAndDelete(id);
        return res.status(200).json({
            msg: `Книга с id ${id} успешно удалена`
        })
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось удалить книгу"
        });
    }
});

// Вход
app.post('/auth/login', async (req, res) => {
    const { login } = req.body;
    const { password } = req.body;

    try {
        const user = await User.findOne({ login: login });
        if (!user) {
            return res.status(400).json({
                msg: "Не удалось найти пользователя с таким логином " + login
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                msg: "Неправильный пароль"
            });
        }

        const payload = {
            userId: user._id
        };

        const token = jwt.sign(payload, secretKey, {
            expiresIn: '1h'
        });

        return res
            .status(200)
            .cookie('access_token', token)
            .json({
                msg: "success",
                token
            });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось войти"
        });
    }
});

// Регистрация пользователя (только админы)
app.post('/auth/reg/:token',/* authCheck, authAdminCheck,*/ uservalidation, async (req, res) => {
    // убрал мидлвары ибо наделал хуйни с куками

    try {
        const token = req.params.token;

        const userId = jwt.verify(token, secretKey).userId;
        const user = await User.findById(userId);
        if (user.role !== "ADMIN") {
            return res.status(400).json({
                msg: "Отказано в доступе"
            });
        }

        const { name } = req.body;
        const { surname } = req.body;
        const { login } = req.body;
        const { password } = req.body;
        const { classObj } = req.body || '';
        const role = 'STUDENT';

        const userWithActualLogin = await User.findOne({ login: login });

        if (userWithActualLogin) {
            return res.status(401).json({
                msg: "Данный логин уже занят, попробуйте другой"
            });
        }

        const hashedPwd = await bcrypt.hash(password, 8);

        const userr = await User.create({
            name: name,
            surname: surname,
            login: login,
            hashedPassword: hashedPwd,
            role: role,
            classObj: classObj,
            books: []
        });

        return res.status(200).json({
            msg: "Пользователь успешно зарегистрирован"
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось добавить пользователя",
            error: e.message
        })
    }
});



app.post('/test/auth/login', async (req, res) => {
    const { login } = req.body;
    const { password } = req.body;
    console.log('req', login, password)

    try {
        const user = await User.findOne({ login: login });
        if (!user) {
            return res.status(400).json({
                msg: "Не удалось найти пользователя с таким логином " + login
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                msg: "Неправильный пароль"
            });
        }

        const payload = {
            userId: user._id
        };

        const token = jwt.sign(payload, secretKey, {
            expiresIn: '5s'
        });

        return res
            .status(200)
            .json({
                msg: "success",
                token
            });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            msg: "Не удалось войти"
        });
    }
});