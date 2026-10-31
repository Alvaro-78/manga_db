import { supabase } from './supabase'
import { byName, toCamelCase } from './mangas'

export async function loadTags() {
  const { data, error } = await supabase.from('tags').select('id, name')
  if (error) throw error
  return [...data].sort(byName)
}

export async function createTag(text) {
  const { data, error } = await supabase.from('tags').insert({ name: toCamelCase(text) }).select('id, name').single()
  if (error) throw friendly(error)
  return data
}

export async function renameTag(id, text) {
  const { data, error } = await supabase.from('tags').update({ name: toCamelCase(text) }).eq('id', id).select('id, name').single()
  if (error) throw friendly(error)
  return data
}

export async function deleteTag(id) {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw friendly(error)
}

function friendly(error) {
  return new Error(error.code === '23505' ? 'Ya existe un tag con ese nombre.' : error.message)
}
