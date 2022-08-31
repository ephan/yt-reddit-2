import { ArrowDownIcon, ArrowUpIcon, BookmarkIcon, ChatAltIcon, DotsHorizontalIcon, GiftIcon, ShareIcon } from '@heroicons/react/outline'
import React, { useEffect, useState } from 'react'
import Avatar from './Avatar'
import TimeAgo from 'react-timeago'
import Link from 'next/link'
import {Jelly} from '@uiball/loaders'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useMutation, useQuery } from '@apollo/client'
import { GET_ALL_VOTES_BY_POST_ID } from '../graphql/queries'
import { ADD_VOTE } from '../graphql/mutations'

type Props = {
    post: Post
}

function Post({post} : Props ) {

    const[vote, setVote] = useState<boolean>()
    const {data: session} = useSession();

    const {data, loading} = useQuery(GET_ALL_VOTES_BY_POST_ID, {
        variables: {
            post_id: post?.id
        }
    })

    const [addVote] = useMutation(ADD_VOTE, {
        refetchQueries: [GET_ALL_VOTES_BY_POST_ID, 'getVotesByPostId']
    })


    const upVote = async (isUpvote: boolean) => {
        if (!session) {
            //        toast("You can not vote if you're not signd in");
             //       return;
        }
        if (vote && isUpvote) return;
        if (vote === false && !isUpvote) return;
        console.log('voting...', isUpvote);
        
        await addVote({
            variables: {
                post_id: post.id,
                username: session?.user?.name || 'elon musk',
                upvote: isUpvote
            }
        })
    }

    useEffect(() => {
        const votes : Vote[] = data?.getVotesByPostId;
        const currentUser = session?.user?.name || 'elon musk';
        //Latest vote
        const vote = votes?.find(vote => vote.username === currentUser)?.upvote;

        setVote(vote); //set vote in local state

    }, [data])


    const displayVotes = (data: any) : number => {
      const votes: Vote[] = data?.getVotesByPostId;

      if (!votes || votes.length === 0) {
        return 0;
      }

      const displayNumber: number = votes?.reduce((total, curr) => { 
        total += (curr.upvote ? 1 : -1);
        return total;
       }, 0) || 0;

      if (displayNumber === 0) {
        return (votes[0]?.upvote ? 1 : -1);
      }

      return displayNumber;
    }

    if(!post) return (
        <div>
            <Jelly size={50} color="#FF4501"/>
        </div>
    )

  return (
    <Link href={`/post/${post.id}`}>
      <div className="flex rounded-md border cursor-pointer border-gray-300 bg-white shadow-sm hover:border hover:border-gray-600">
        {/* votes */}
        <div className="flex flex-col items-center justify-start space-y-1 rounded-l-md bg-gray-50 p-4 text-gray-400">
          <ArrowUpIcon onClick={()=>upVote(true)} className="voteButtons hover:text-red-400" />
          <p className="text-xs font-bold text-black">{displayVotes(data)}</p>
          <ArrowDownIcon onClick={()=>upVote(false)} className="voteButtons hover:text-blue-400" />
        </div>

        <div className="p-3 pb-1 ">
          {/*post header*/}
          <div className="flex items-center space-x-2">
            <Avatar seed={post.subreddit[0]?.topic} />
            <p className="text-xs text-gray-400">
              <Link href={`/subreddit/${post.subreddit[0]?.topic}`}>
                <span className="font-bold text-black hover:text-blue-400">
                  r/{post.subreddit[0]?.topic}
                </span>
              </Link>
              * Posted by u/ {post.username} <TimeAgo date={post.created_at} />
            </p>
          </div>
          {/*body*/}

          <div className="py-4">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm font-light">{post.body}</p>
          </div>
          {/*image*/}
          <img className="w-full" src={post.image} alt="" />
          {/*footer*/}
          <div className="flex space-x-4 text-gray-400">
            <div className="postButtons">
              <ChatAltIcon className="h-6 w-6" />
              <p className="">{post.comments.length} Comments</p>
            </div>

            <div className="postButtons">
              <GiftIcon className="h-6 w-6" />
              <p className="hidden sm:inline">Award</p>
            </div>

            <div className="postButtons">
              <ShareIcon className="h-6 w-6" />
              <p className="hidden sm:inline">Share</p>
            </div>

            <div className="postButtons">
              <BookmarkIcon className="h-6 w-6" />
              <p className="hidden sm:inline">Save</p>
            </div>

            <div className="postButtons">
              <DotsHorizontalIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default Post