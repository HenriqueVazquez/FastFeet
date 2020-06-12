import FileAvatar from '../models/File_avatar';

class FileAController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await FileAvatar.create({
      name,
      path,
    });
    return res.json(file);
  }
}

export default new FileAController();
