# FastFeet
Aplicação de uma transportadora fictícia, desafio final do bootcamp GoStack, foi dividido em 4 partes, e será uma aplicação completa(Back-end, Front-end e Mobile)
Fastfeet
Desafio 2: FastFeet, o início
⚠️ Etapa 1/4 do Desafio Final ⚠️
Esse desafio faz parte do Desafio Final, que é uma aplicação completa (Back-end, Front-end e Mobile) que é avaliada para emissão do Certificado do Bootcamp GoStack, por isso é fundamental que ele seja feito com muito empenho!

“Não espere para plantar, apenas tenha paciência para colher”!
GitHub language count Made by Rocketseat License Stargazers

Sobre o desafio   |    Entrega   |    Licença

🚀 Sobre o desafio
A aplicação que iremos dar início ao desenvolvimento a partir de agora é um app para uma transportadora fictícia, o FastFeet.

Nesse primeiro desafio vamos criar algumas funcionalidades básicas que aprendemos ao longo das aulas até aqui. Esse projeto será desenvolvido aos poucos até o fim da sua jornada onde você terá uma aplicação completa envolvendo back-end, front-end e mobile, que será utilizada para a certificação do bootcamp, então, bora pro código!

Um pouco sobre as ferramentas
Você deverá criar a aplicação do zero utilizando o Express, além de precisar configurar as seguintes ferramentas:

Sucrase + Nodemon;
ESLint + Prettier + EditorConfig;
Sequelize (Utilize PostgreSQL ou MySQL);
Funcionalidades
Abaixo estão descritas as funcionalidades que você deve adicionar em sua aplicação.

1. Autenticação
Permita que um usuário se autentique em sua aplicação utilizando e-mail e uma senha.

Crie um usuário administrador utilizando a funcionalidade de seeds do sequelize, essa funcionalidade serve para criarmos registros na base de dados de forma automatizada.

Para criar um seed utilize o comando:

yarn sequelize seed:generate --name admin-user
No arquivo gerado na pasta src/database/seeds adicione o código referente à criação de um usuário administrador:

const bcrypt = require("bcryptjs");

module.exports = {
  up: QueryInterface => {
    return QueryInterface.bulkInsert(
      "users",
      [
        {
          name: "Distribuidora FastFeet",
          email: "admin@fastfeet.com",
          password_hash: bcrypt.hashSync("123456", 8),
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      {}
    );
  },

  down: () => {}
};
