import { useState, useEffect } from "react";
import { getUniversity, getCourses, getEnrolledCourses, enrollInCourse, unenrollFromAllCourses, unenrollFromCourse } from "../api.js";

export function useCourseEnrollment(userId) {
    const [university, setUniversity] = useState(null);
    const [courses, setCourses] = useState([]);
    const [enrolledIds, setEnrolledIds] = useState(new Set());

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrolling, setEnrolling] = useState(false);

    const [showLeaveAllModal, setShowLeaveAllModal] = useState(false);
    const [leavingAll, setLeavingAll] = useState(false);

    const [leaveOneCourse, setLeaveOneCourse] = useState(null);
    const [leavingOne, setLeavingOne] = useState(false);

    useEffect(() => {
        getUniversity()
            .then(uni => {
                setUniversity(uni);
                return Promise.all([getCourses(uni.id), getEnrolledCourses(userId)]);
            })
            .then(([allCourses, enrolled]) => {
                setCourses(allCourses);
                setEnrolledIds(new Set(enrolled.map(c => c.id)));
            })
            .catch(console.error);
    }, [userId]);

    async function handleEnroll(courseOverride = null) {
        const course = courseOverride ?? selectedCourse;
        if (!course) return;
        setEnrolling(true);
        try {
            await enrollInCourse(userId, course.id);
            setEnrolledIds(prev => new Set([...prev, course.id]));
            setSelectedCourse(null);
        } catch (err) {
            console.error(err);
        } finally {
            setEnrolling(false);
        }
    }

    async function handleLeaveAll() {
        setLeavingAll(true);
        try {
            await Promise.all([...enrolledIds].map(courseId => unenrollFromAllCourses(userId, courseId)));
            setEnrolledIds(new Set());
            setShowLeaveAllModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLeavingAll(false);
        }
    }

    async function handleLeaveOne() {
        if (!leaveOneCourse) return;
        setLeavingOne(true);
        try {
            await unenrollFromCourse(userId, leaveOneCourse.id);
            setEnrolledIds(prev => {
                const next = new Set(prev);
                next.delete(leaveOneCourse.id);
                return next;
            });
            setLeaveOneCourse(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLeavingOne(false);
        }
    }

    return {
        university, courses, enrolledIds,
        selectedCourse, setSelectedCourse,
        enrolling, handleEnroll,
        showLeaveAllModal, setShowLeaveAllModal, leavingAll, handleLeaveAll,
        leaveOneCourse, setLeaveOneCourse, leavingOne, handleLeaveOne,
    };
}