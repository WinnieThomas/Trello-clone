import { databases } from "@/appwrite"


export const getTodosGroupByColoumn = async()=>{
    const data= await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TODOS_ID!,
    );

   // console.log(data);
    const todos = data.documents;

    const coloumns = todos.reduce((acc,todo) => {
        if(!acc.get(todo.status)){
            acc.set(todo.status,{
                id:todo.status,
                todos:[]
            })
        }

        acc.get(todo.status)!.todos.push({
            $id:todo.$id,
            $createdAt:todo.createdAt,
            title:todo.title,
            status:todo.status,
            //get image if exists on the todo
            ...(todo.image && {image:JSON.parse(todo.image)})
        });
        return acc;

    }, new Map<TypedColoumn,Coloumn>)

   // console.log(coloumns);

    //if coloumns doesn't have todo,inprogress or done then add them with thw empty todos.
    const coloumnTypes:TypedColoumn[]=["todo","inprogress","done"];
    for (const coloumnType of coloumnTypes){
        if(!coloumns.get(coloumnType)){
            coloumns.set(coloumnType,{
                id:coloumnType,
                todos:[],
            });
        }
    }

    console.log(coloumns);

    //sort coloumns by coloumn types
    const sortedColoumns = new Map(
        Array.from(coloumns.entries()).sort(
            (a, b) => coloumnTypes.indexOf(a[0]) - coloumnTypes.indexOf(b[0])
        )
    );

    const board:Board ={
        coloumns:sortedColoumns,
    }

    return board;
}