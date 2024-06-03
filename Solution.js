//1.Find all the topics and tasks which are thought in the month of October
db.task.aggregate([
    {
      $lookup: {
        from: 'topic',
        localField: 'date',
        foreignField: 'date',
        as: 'Topic'
      }
    },
    {
      $addFields: {
        month: { $substr: ["$date", 5, 2] }
      }
    },
    {
      $match: {
        month: "10"
      }
    },
    {
      $project: {
        _id: 0,
        date: 1,
        taskName: 1,
        "Topic.topicName": 1
      }
    }
  ]).toArray();
  
  //2.Find all the company drives which appeared between 15 oct-2020 and 31-oct-2020
  db.companyDrives.find({
    date: {
        $gte: "2020-10-15",
        $lte: "2020-10-21"
    },
  },{date:1,companyName:1,location:1}).toArray();
  
  
  // 3.Find all the company drives and students who are appeared for the placement.
  db.companyDrives.aggregate({
    $lookup: {
      from: 'user',
      localField: 'attendees.userId',
      foreignField: 'id',
      as: 'CompanyWithAttendees'
    }
  },
  {
    $project: {
      _id: 0,
      companyName: 1,
      location: 1,
      "CompanyWithAttendees.name": 1
    }
  }).toArray();
  
  // 4.Find the number of problems solved by the user in codekata
  db.codekata.aggregate({
    $lookup: {
      from: 'user',
      localField: 'userId',
      foreignField: 'id',
      as: 'UserAndSolvedProblems'
    }
  }, {
    $project: {
      userId: 1,
      problemSolved: 1,
      name: { $arrayElemAt: ["$UserAndSolvedProblems.name", 0] }
    }
  }).toArray();
  
  //5.Find all the mentors with who has the mentee's count more than 15
  db.mentors.find({ $expr: { $gt: [{ $size: "$studentIds" }, 15] } }, {
    _id: 0,
    mentorName: 1
  });
  
  //6.Find the number of users who are absent and task is not submitted  between 15 oct-2020 and 31-oct-2020
  db.attendance.aggregate([
    {
        $match: {
          date: {
            $gte: "2020-10-15",
            $lte: "2020-10-31"
          }
        }
    },
    {
        $unwind: "$attendees"
    },
    {
        $match: {
            "attendees.status": false
        }
    },
    {
        $project: {
            _id: 0,
            userId: "$attendees.userId"
        }
    },
    {
        $lookup: {
            from: "task",
            let: { userId: "$userId" },
            pipeline: [
                {
                    $match: {
                      date: {
                        $gte: "2020-10-15",
                        $lte: "2020-10-31"
                      }
                    }
                },
                {
                    $unwind: "$users"
                },
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$users.userId", "$$userId"] },
                                { $eq: ["$users.status", false] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        userId: "$users.userId"
                    }
                }
            ],
            as: "incompleteTasks"
        }
    },
    {
        $match: {
            "incompleteTasks.userId": { $exists: true }
        }
    },
    {
        $group: {
            _id: "$userId"
        }
    },
    {
        $count: "absentAndIncompleteUsers"
    }
  ]).toArray();
  