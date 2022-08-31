import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import Avatar from './Avatar';
import { LinkIcon, PhotographIcon } from '@heroicons/react/outline'
import { useForm } from 'react-hook-form'
import { ADD_POST, ADD_SUBREDDIT } from '../graphql/mutations';
import { useMutation } from '@apollo/client';
import client from '../apollo-client'
import { GET_ALL_POSTS, GET_SUBREDDIT_BY_TOPIC } from '../graphql/queries';
import toast from 'react-hot-toast';

type FormData = {
  postTitle: string;
  postBody: string;
  postImage: string;
  subreddit: string;
};

type Props = {
    subreddit?: string;
}

function PostBox({subreddit}:Props) {
  const { data: session } = useSession();
  const [addPost] = useMutation(ADD_POST, {
    refetchQueries: [GET_ALL_POSTS, "getPostList"],
  }); //returns addPost function to execute from
  const [addSubreddit] = useMutation(ADD_SUBREDDIT); //returns addPost function to execute from

  const [ imageBoxOpen, setImageBoxOpen ] = useState<boolean>(false)
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: {errors},
  } = useForm<FormData>()

  const onSubmit = handleSubmit(async (formData) => {
    console.log(formData);
    const notification = toast.loading('creating new type...')
    try {

        console.log(`checking if subreddit exists`, formData.subreddit)

        const { data: {getSubredditListByTopic},
            } = await client.query({
            query: GET_SUBREDDIT_BY_TOPIC,
            variables: {
                topic: formData.subreddit || subreddit
            }
        })

        const subredditExists = getSubredditListByTopic.length > 0;

        if (!subredditExists) {
            console.log(`subreddit is new, creating a new subreddit`)
            const { data: { insertSubreddit: newSubreddit } } =  await addSubreddit({
                variables: {
                    topic: formData.subreddit
                }
            })
            console.log(`creating post...`, formData);
            const image = formData.postImage || '';

            const {
                data: { insertPost: newPost },
            } = await addPost({
                variables: {
                    body: formData.postBody,
                    image: image,
                    subreddit_id: newSubreddit.id,
                    title: formData.postTitle,
                    username: session?.user?.name || 'Elon Musk',
                }
            })

            console.log(`new post added: `, newPost);
        } else {
            //use existing subreddits
            console.log(`using exsiting subreddit`)
            console.log(getSubredditListByTopic)
            const image = formData.postImage || '';

            const {
                data: { insertPost: newPost },
            } = await addPost({
                variables: {
                    body: formData.postBody,
                    image: image,
                    subreddit_id: getSubredditListByTopic[0].id,
                    title: formData.postTitle,
                    username: session?.user?.name || 'Elon Musk',
                }
            })

        }

        //after the post has been added
        setValue('postBody', '')
        setValue('postImage', '')
        setValue('postTitle', '')
        setValue('subreddit', '')
        toast.success('new post created!', {
            id: notification
        })
        
    } catch(error) {
        toast.error('whoops, something went wrong', {
            id: notification
        })
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      className="sticky top-16 z-50 bg-white border rounded-md border-gray-300 p-2"
    >
      <div className="flex items-center space-x-3">
        <Avatar />

        <input
          {...register("postTitle", { required: true })}
          disabled={session ? false : false}
          className="flex-1 rounded-md bg-gray-50 p-2 pl-5 outline-none"
          type="text"
          placeholder={
            !session ? subreddit ? `Create a post in r/${subreddit}` : "Create a post by writing a title!" : "Sign in to post"
          }
        />

        <PhotographIcon
          onClick={() => setImageBoxOpen(!imageBoxOpen)}
          className={`h-6 text-gray-300 cursor-pointer ${
            imageBoxOpen && "text-blue-300"
          }`}
        />
        <LinkIcon className="h-6 text-gray-300" />
      </div>

      {!!watch("postTitle") && (
        <div className="flex flex-col py-2">
          {/*Body*/}
          <div className="flex items-center px-2">
            <p className="min-w-[90px]">Body:</p>
            <input
              className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              {...register("postBody")}
              type="text"
              placeholder="text (optional)"
            />
          </div>

        {!subreddit && (
          <div className="flex items-center px-2">
          <p className="min-w-[90px]">Subreddit:</p>
          <input
            className="m-2 flex-1 bg-blue-50 p-2 outline-none"
            {...register("subreddit", { required: true })}
            type="text"
            placeholder="i.e. reactjs"
          />
        </div>
        )}

          {imageBoxOpen && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Image URL:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register("postImage")}
                type="text"
                placeholder="optional..."
              />
            </div>
          )}

          {/*Errors*/}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2 p-2 text-red-500">
              {errors.postTitle?.type === "required" && (
                <p>-A post title is required</p>
              )}
              {errors.subreddit?.type === "required" && (
                <p>-A subreddit is required</p>
              )}
            </div>
          )}

          {!!watch("postTitle") && (
            <button
              type="submit"
              className="w-full p-2 rounded-full bg-blue-400 text-white"
            >
              Create Post
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default PostBox;