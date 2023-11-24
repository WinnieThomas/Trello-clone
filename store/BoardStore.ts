import { ID, databases } from '@/appwrite';
import { getTodosGroupByColoumn } from '@/lib/getTodosGroupByColoumn';
import uploadImage from '@/lib/uploadImage';
import { create } from 'zustand';


interface BoardState{
   board:Board
   getBoard: ()=>void
   setBoardState: (board:Board)=>void;
   updateTodoInDb:(todo:Todo,coloumnId:TypedColoumn)=> void;
   searchString: string,
   newTaskInput:string,
   newTaskType:TypedColoumn,
   image: File | null,
   setNewTaskInput:(input:string)=>void;
   setSearchString: (searchString:string)=>void;
   addTask:(todo:string,coloumnId:TypedColoumn,image?:File|null)=>void;
   deleteTask:(taskIndex:number, todoId:Todo,id:TypedColoumn)=> void;
   setNewTaskType:(coloumnId:TypedColoumn)=>void;
   setImage:(image:File|null)=>void;
}

export const useBoardStore = create<BoardState>((set,get) => ({
  board:{
    coloumns: new Map<TypedColoumn,Coloumn>()},
    searchString:"",
    newTaskInput:"",
    newTaskType:"todo",
    image:null,
  setSearchString:(searchString)=>set({searchString}),
  getBoard:async()=>{
     const board = await getTodosGroupByColoumn();
     set({board});
  },

  setBoardState: (board)=> set({board}),

  deleteTask:async(taskIndex:number,todo:Todo,id:TypedColoumn)=>{
    const newColoumns = new Map(get().board.coloumns);

    //delete todoId from newcoloumns
    newColoumns.get(id)?.todos.splice(taskIndex,1);
    set({board:{coloumns:newColoumns}});
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COLLECTION_ID!,
      todo.$id,
    );
  },

  setNewTaskInput:(input:string) => set({newTaskInput:input}),
  setNewTaskType:(coloumnId:TypedColoumn)=>set({newTaskType:coloumnId}),
  setImage:(image:File|null)=>set({image}),

  updateTodoInDb:async(todo, coloumnId) =>{
    await databases.updateDocument(
    process.env.NEXT_PUBLIC_DATABASE_ID!,
    process.env.NEXT_PUBLIC_COLLECTION_ID!,
    todo.$id,
    {
      title:todo.title,
      status:coloumnId
    }
    )
  },

  addTask:async(todo:string, coloumnId:TypedColoumn,image?:File|null)=>{
    let file:Image|undefined;
    if(image){
      const fileUploaded = await uploadImage(image);
      if(fileUploaded){
        file={
          bucketId:fileUploaded.bucketId,
          fileId:fileUploaded.$id,
        }
      }
    }
    const{$id}=await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COLLECTION_ID!,
      ID.unique(),
      {
        title:todo,
        status:coloumnId,
        ...(file &&{image:JSON.stringify(file)}),
      }
    );
    set({newTaskInput:""});

    set((state)=>{
      const newColoumns = new Map(state.board.coloumns);
       
      const newTodo:Todo ={
        $id,
        $createdAt: new Date().toISOString(),
        title:todo,
        status:coloumnId,
        ...(file && {image:file}),

      };
      const coloumn = newColoumns.get(coloumnId);

      if(!coloumn){
        newColoumns.set(coloumnId,{
          id:coloumnId,
          todos:[newTodo],
        });
      }
      else{
        newColoumns.get(coloumnId)?.todos.push(newTodo);
      }

      return {
        board:{
          coloumns:newColoumns,
        }

      }
    });

  }
}))