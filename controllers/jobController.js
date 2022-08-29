import Job from "../models/Job.js";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors/index.js";
import checkPermissions from "../utils/checkPermissions.js";
import mongoose from "mongoose";
import moment from "moment";

// create
const createJob = async (request, response) => {
  const { company, position } = request.body;

  if (!company || !position) {
    throw new BadRequestError("Please provide all values");
  }
  // middleware authentication at server, attach the user objectId (userId will be attached when jobCreated)
  request.body.createdBy = request.user.userId
  const job = await Job.create(request.body)
  response.status(StatusCodes.CREATED).json({ job })
};

// get all jobs (refactored)
const getAllJobs = async (request, response) => {
  const { status, jobType, sort, search } = request.query // query params

  const queryObject = { createdBy: request.user.userId }

  // add stuff base on condition
  if(status && status !== 'all'){
    queryObject.status = status
  }

  if(jobType && jobType !== 'all'){
    queryObject.jobType = jobType
  }

  if(search){
    queryObject.position = { $regex: search , $options: 'i' } // "i" means case insensitive
  }

  // No AWAIT
  console.log(queryObject);
  let result = Job.find(queryObject);

  // chain sort condition
  if(sort === 'latest'){
    result = result.sort('-createdAt') // descending
  }

  if(sort === 'oldest'){
    result = result.sort('createdAt') // ascending
  }

  if(sort === 'a-z'){
    result = result.sort('position') // ascending
  }

  if(sort === 'z-a'){
    result = result.sort('-position') // descending
  }

  // setup pagination
  const page = Number(request.query.page) || 1
  const limit = Number(request.query.limit) || 10
  const skip = (page - 1) * limit // 10
  result = result.skip(skip).limit(limit)
  // 83 total
  // 10 10 10 10 10 10 10 10 3

  const jobs = await result

  // total of jobs and pages number to display regardless of number of query (postman)
  const totalJobs = await Job.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalJobs / limit)

  response.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages })
};

// update job
const updateJob = async (request, response) => {
   const { id: jobId } = request.params;
   const { company, position } = request.body;

   if(!company || !position){
    throw new BadRequestError("Please provide all values")
   }
   const job = await Job.findOne({ _id: jobId });

   if(!job){
     throw new NotFoundError(`No job with id : ${jobId}`)
    }
    
    // check permissions (can't be able to edit others created job userId Id must match)
    // console.log(typeof request.user.userId);
    // console.log(typeof job.createdBy);

    checkPermissions(request.user, job.createdBy)
  
   const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, request.body, {
    new: true,
    runValidators: true,
   });
   response.status(StatusCodes.OK).json({ updatedJob })

   // alternative approach
  //  job.position = position
  //  job.company = company
  //  job.jobLocation = jobLocation

  //  await job.save();
  //  response.status(StatusCodes.OK).json({ job })

  /* Difference when using findOneAndUpdate it does not trigger the hook (will find in model if you use one),
   no error occur and will update even if the req.body property not complete. */
};

// delete job
const deleteJob = async (request, response) => {
  const { id: jobId } = request.params
  const job = await Job.findOne({ _id: jobId })

  if(!job){
    throw new CustomError.NotFoundError(`No job with id: ${jobId}`)
  }

  checkPermissions(request.user, job.createdBy)

  await job.remove()
  response.status(StatusCodes.OK).json({ msg: "Success! Job removed "})
};

// show stats
const showStats = async (request, response) => {
  let stats = await Job.aggregate([
    { $match:  { createdBy: mongoose.Types.ObjectId(request.user.userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]); // data is in the array

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr
    acc [title] = count
    return acc
  }, {}) // data converted into object type

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  }

  let monthlyApplications = await Job.aggregate ([
    { $match: { createdBy: mongoose.Types.ObjectId(request.user.userId) } },
    { $group: {
      _id: { year: {$year: '$createdAt'}, 
      month: {$month: '$createdAt'}},

     count: {$sum: 1},
    },
  },

  { $sort: {'_id.year': -1, '_id.month': -1} }, 
  { $limit: 6 }
  ])

  // used moment library (refactored data)
  monthlyApplications = monthlyApplications.map((item) => {

    const { _id: {year, month}, count } = item
    const date = moment().month(month -1).year(year).format('MMM Y')
    return { date, count }
  })
  .reverse()

  response.status(StatusCodes.OK).json({ defaultStats, monthlyApplications })
};

export { createJob, deleteJob, getAllJobs, updateJob, showStats };
 