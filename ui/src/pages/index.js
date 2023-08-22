import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Authenticator, Heading, Text, Flex, Loader, Image, Alert, Link } from '@aws-amplify/ui-react';
import { getWorkoutByDate, isConfigured } from '../graphql/queries';
import { API } from 'aws-amplify';
import Workout from '../components/Workout';

const Home = ({ signout, user }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isUserConfigured, setIsUserConfigured] = useState(false);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-US'));
  const [workoutDetail, setWorkoutDetail] = useState();

  useEffect(() => {
    if (router.query.date && isValidDate(router.query.date)) {
        const queryDate = new Date(`${router.query.date}T23:59:59`);
        setDate(getLocalDate(queryDate));
    } else {
      setDate(getLocalDate());
    }
  }, [router.query]);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      setLoading(true);
      try {
        const workoutSettings = await API.graphql({
          query: getWorkoutByDate,
          variables: {
            date: new Date(date).toISOString().split('T')[0]
          }
        });

        setWorkoutDetail(workoutSettings.data.getWorkoutByDate);
        const configuration = await API.graphql({ query: isConfigured });
        setIsUserConfigured(configuration.data.isUserConfigured);
      } catch (err) {

      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [date]);

  const getLocalDate = (date) => {
    if(!date){
      date = new Date();
    }

    const localYear = date.getFullYear();
    const localMonth = date.getMonth() + 1;
    const localDay = date.getDate();

    const localDateString = localYear + '-' + (localMonth < 10 ? '0' : '') + localMonth + '-' + (localDay < 10 ? '0' : '') + localDay;
    return localDateString;
  };

  const isValidDate = (dateString) => {
    const timestamp = Date.parse(dateString);
    return !isNaN(timestamp);
  }

  if (loading) {
    return (
      <Flex direction="column" alignItems="center" justifyContent="center" >
        <Loader size="large" />
      </Flex>
    );
  }

  return (
    <Authenticator socialProviders={["google"]}>
      {({ signOut, user }) => (
        <Flex direction="column" width="100%">
          <Head>
            <title>Workout | Ready, Set, Cloud Fitness!</title>
          </Head>
          {!isUserConfigured && (
            <Alert variation="warning" hasIcon={true} isDismissible={false} heading="Update needed">
              Looks like you still need some configuration. Head over to <Link href="/settings">settings</Link> to finish setting up!
            </Alert>
          )}
          <Alert variation="error" hasIcon={true} isDismissible={false} heading="Oh man.">
              This got a little too popular! We ran out of budget to create new workouts this month. You can still <Link href="/workouts">browse our workout list</Link> to get in some exercise.
            </Alert>
          {workoutDetail?.workout && (
            <Workout detail={workoutDetail} date={date} />
          )}
          {!workoutDetail?.workout && (
            <Flex direction="column" alignItems="center">
              <Heading level={5}>No Workout Today</Heading>
              <Text>You can take it easy, maybe go do some stretching.</Text>
              <Image src="https://readysetcloud.s3.amazonaws.com/day-off.jpg" width="50%" />
            </Flex>
          )}
        </Flex>
      )}
    </Authenticator>
  );
};

export default Home;
