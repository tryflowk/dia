import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ── Auth Hook ──
export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
    else {
      // Create profile on first login
      const { data: newProfile } = await supabase.from('profiles').insert({
        id: userId,
        name: '',
        score: 0,
        day_start_time: '07:00',
        daily_plan_time: '21:00',
      }).select().single()
      setProfile(newProfile)
    }
    setLoading(false)
  }

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        score: 0,
        day_start_time: '07:00',
        daily_plan_time: '21:00',
      })
    }
    return { data }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates) => {
    if (!user) return
    const { data } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (data) setProfile(data)
  }

  const addScore = async (points) => {
    if (!user || !profile) return
    const newScore = Math.round((profile.score + points) * 100) / 100
    await updateProfile({ score: newScore })
  }

  return { user, profile, loading, signUp, signIn, signOut, updateProfile, addScore, setProfile }
}

// ── Data Hook ──
export function useData(userId) {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [tRes, pRes, plRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).is('archived_at', null).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('user_id', userId).is('archived_at', null).order('created_at', { ascending: true }),
      supabase.from('daily_plans').select('*, daily_plan_tasks(*)').eq('user_id', userId).order('date', { ascending: false }).limit(60),
    ])
    setTasks(tRes.data || [])
    setProjects(pRes.data || [])
    setPlans((plRes.data || []).map(p => ({ ...p, plan_tasks: p.daily_plan_tasks || [] })))
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  // ── Tasks ──
  const addTask = async (task) => {
    const { data } = await supabase.from('tasks').insert({ ...task, user_id: userId }).select().single()
    if (data) setTasks(p => [data, ...p])
    return data
  }

  const updateTask = async (id, updates) => {
    const { data } = await supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (data) setTasks(p => p.map(t => t.id === id ? data : t))
    return data
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(p => p.filter(t => t.id !== id))
  }

  // ── Projects ──
  const addProject = async (proj) => {
    const { data } = await supabase.from('projects').insert({ ...proj, user_id: userId }).select().single()
    if (data) setProjects(p => [...p, data])
    return data
  }

  const updateProject = async (id, updates) => {
    const { data } = await supabase.from('projects').update(updates).eq('id', id).select().single()
    if (data) setProjects(p => p.map(x => x.id === id ? data : x))
    return data
  }

  const deleteProject = async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(p => p.filter(x => x.id !== id))
    // Unlink tasks
    const linked = tasks.filter(t => t.project_id === id)
    for (const t of linked) await updateTask(t.id, { project_id: null })
  }

  // ── Plans ──
  const savePlan = async (date, planTasks, frogId) => {
    // Upsert plan
    const { data: plan } = await supabase.from('daily_plans')
      .upsert({ user_id: userId, date, status: 'planned', planned_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
      .select().single()

    if (!plan) return null

    // Delete old plan_tasks for this plan
    await supabase.from('daily_plan_tasks').delete().eq('daily_plan_id', plan.id)

    // Insert new plan_tasks
    const rows = planTasks.map((taskId, i) => ({
      daily_plan_id: plan.id,
      task_id: taskId,
      order_index: i,
      is_frog: taskId === frogId,
      status: 'not_started',
    }))
    const { data: pts } = await supabase.from('daily_plan_tasks').insert(rows).select()

    // Update tasks planned_date
    for (const taskId of planTasks) {
      await updateTask(taskId, { planned_date: date, status: 'not_started' })
    }

    const fullPlan = { ...plan, plan_tasks: pts || [] }
    setPlans(p => {
      const filtered = p.filter(x => x.date !== date)
      return [fullPlan, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
    })
    return fullPlan
  }

  const updatePlanTaskStatus = async (planTaskId, status) => {
    const { data } = await supabase.from('daily_plan_tasks').update({ status, was_completed: status === 'done' }).eq('id', planTaskId).select().single()
    if (data) {
      setPlans(p => p.map(plan => ({
        ...plan,
        plan_tasks: plan.plan_tasks.map(pt => pt.id === planTaskId ? data : pt)
      })))
      // Also update the task itself
      if (data.task_id) {
        await updateTask(data.task_id, { status, completed_at: status === 'done' ? new Date().toISOString() : null })
      }
    }
    return data
  }

  const closePlan = async (planId, scoreData, decisions) => {
    // Apply decisions to pending tasks
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1); const tmrwStr = tmrw.toISOString().split('T')[0]
    for (const [taskId, decision] of Object.entries(decisions)) {
      if (decision === 'tomorrow') await updateTask(taskId, { status: 'not_started', planned_date: tmrwStr })
      else if (decision === 'return') await updateTask(taskId, { status: 'not_started', planned_date: null })
    }

    // Update plan
    const { data } = await supabase.from('daily_plans').update({
      status: 'closed',
      day_score: scoreData.ds,
      bonus_score: scoreData.bs,
      total_score: scoreData.ts,
      had_exercise: scoreData.ex,
      completed_frog: scoreData.fr,
      completed_all_categories: scoreData.ac,
    }).eq('id', planId).select().single()

    if (data) {
      const plan = plans.find(p => p.id === planId)
      setPlans(p => p.map(x => x.id === planId ? { ...x, ...data } : x))
    }
    return scoreData.ts
  }

  const reopenPlan = async (planId) => {
    const { data } = await supabase.from('daily_plans').update({ status: 'planned', day_score: 0, bonus_score: 0, total_score: 0 }).eq('id', planId).select().single()
    if (data) setPlans(p => p.map(x => x.id === planId ? { ...x, ...data } : x))
  }

  return {
    tasks, projects, plans, loading, reload: load,
    addTask, updateTask, deleteTask,
    addProject, updateProject, deleteProject,
    savePlan, updatePlanTaskStatus, closePlan, reopenPlan,
  }
}
