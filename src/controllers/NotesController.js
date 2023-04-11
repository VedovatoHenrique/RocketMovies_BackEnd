const knex = require('../database/knex');

class NotesController {
  async create(request, response) {
    const { title, description, rating, tags } = request.body;
    const {user_id} = request.params;

    const [movie_note_id] = await knex("movie_notes").insert({
      title,
      description,
      rating,
      user_id
    });

    const tagsInsert = tags.map(name => {
      return {
        movie_note_id,
        name,
        user_id
      }
    });

    await knex("movie_tags").insert(tagsInsert);

    return response.json({
      status: "Sucessful",
      message: "Movie notes added successfully"
    });
  }

  async show(request, response) {
    const  { id } = request.params;

    const note = await knex("movie_notes").where({ id }).first();
    const tags = await knex("movie_tags").where({ movie_note_id: id }).orderBy("name")

    return response.json({
      ...note,
      tags
    });
  }

  async delete (request, response) {
    const { id } = request.params;

    await knex("movie_notes").where({ id }).delete()

    return response.json({
      status: "Sucessful",
      message: "Note has been deleted"
    })
  }

  async index (request, response) {
    const { user_id, title, tags  } = request.query

    let notes;

    if(tags){
      const filterTags = tags.split(',').map( tag => tag.trim())

      notes = await knex("movie_tags")
      .select([
        "movie_notes.id",
        "movie_notes.title",
        "movie_notes.user_id"
      ])
      .where("movie_notes.user_id", user_id)
      .whereLike("movie_notes.title", `%${title}%`)
      .whereIn("name", filterTags)
      .innerJoin("movie_notes", "movie_notes.id", "movie_tags.movie_note_id")
      .orderBy("movie_notes.title")
            
    }else{
      notes = await knex("movie_notes")
      .where({ user_id })
      .whereLike("title", `%${title}%`)
      .orderBy("title")
    }

    const userTags = await knex("movie_tags").where({ user_id });
    const notesWithTags = notes.map( notes => {
      const noteTags = userTags.filter(tag => tag.movie_note_id === notes.id)

      return {
        ...notes,
        tags: noteTags
      }
    })

    return response.json(notesWithTags)
  }
}

module.exports = NotesController;
