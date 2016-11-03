## 1. Pasar Esquemas

- [ ] Sync
- [ ] Rooms
- [ ] Users
- [ ] Events



## 2. Actions, API, Distpatch

- [ ] "Super" Distpatch atrapado por middleware
- [ ] Cuando la funcion no existe la pide de la libreria Matrix
- [ ] Cuando hace un Post a Matrix crea una transaccion
- [ ] Cuando hace un Post crea un evento del tipo con Id de transaccion
- [ ] El evento creado anteriormente que _pending_ hasta que se obtenga confirmación del server
- [ ] Al tener confirmación del server se quita estado pending y se actualiza transaccion

## 3. Funciones get de cache
Todas estas funciones primero ven si el dato existe en el recurso, si no lo pide al server

- [ ] getUser, devuelve profile del user, llama a loadUser si no está cargado en state. Deja estado en loading,  luego actualiza loading a false.
- [ ] getRoom, devuelve profile del room, llama a loadRoom si no está cargado en state. Deja estado en loading, luego actualiza loading a false.

## 4. Más adelante
- [ ] Reducer User debe tener `currentUserPreferences`. Agregar a Schema