import Chat from './chat.model.js'
import User from '../User/user.model.js'

export const createChat = async (req, res) => {
    try {

        const { emisor, receptor, mensaje } = req.body

        if (!emisor || !receptor || !mensaje) {
            return res.status(400).send(
                { 
                    message: "Faltan campos obligatorios" 
                }
            )
        }

        const emisorExist = await User.findById(emisor)
        const receptorExist = await User.findById(receptor)

        if (!emisorExist || !receptorExist) {
            return res.status(404).send(
                { 
                    message: "Usuario emisor o receptor no encontrado" 
                }
            )
        }

        const nuevoChat = new Chat(req.body)
        const chatGuardado = await nuevoChat.save()
        return res.status(201).send(chatGuardado)
    } catch (err) {
        console.error(err)
        return res.status(500).send(
            { 
                message: "Error al enviar mensaje", 
                error: err.message 
            }
        )
    }
}

export const getChats = async (req, res) => {
    try {
        const chats = await Chat.find()
            .populate('emisor', 'nombre correo')
            .populate('receptor', 'nombre correo')
            .lean()

        return res.status(200).send(chats)
    } catch (err) {
        console.error(err)
        return res.status(500).send(
            { 
                message: "Error al obtener chats", 
                error: err.message 
            }
        )
    }
}

export const getChatBetweenUsers = async (req, res) => {
    try {
        const { user1, user2 } = req.params

        const chats = await Chat.find(
            {
                $or: [
                    { emisor: user1, receptor: user2 },
                    { emisor: user2, receptor: user1 }
                ]
            }
        )
        .sort({ fecha: 1 })
        .populate('emisor', 'nombre')
        .populate('receptor', 'nombre')
        .lean()

        return res.status(200).send(chats)
    } catch (err) {
        console.error(err)
        return res.status(500).send(
            { 
                message: "Error al obtener chat", 
                error: err.message 
            }
        )
    }
}
